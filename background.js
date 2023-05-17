// background.js
//console.log("background.js 돌아감");
//scheduleDailyCheckIn();

function scheduleImmediateCheckIn(ltoken, ltuid) {
  checkAndPerformCheckIn(ltoken, ltuid)
    .then(() => {
      //console.log("출석체크가 완료되었습니다.");
    })
    .catch(error => {
      //console.log(" ");
    });
}

chrome.runtime.onInstalled.addListener(() => {
  scheduleCheckInInterval();
});

function cancelCheckIn() {
  chrome.alarms.clear('CheckIn', () => {
    console.log('출석체크가 취소되었습니다.');
  });
}

function scheduleCheckInInterval() {
  chrome.alarms.create("CheckIn", { periodInMinutes: 30 });

  console.log("30분 간격으로 출석체크가 설정되었습니다.");
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received:", message);

  if (message.type === "scheduleCheckIn") {
    const { ltoken, ltuid } = message;
    scheduleImmediateCheckIn(ltoken, ltuid);
    scheduleDailyCheckIn();
  } else if (message.type === "cancelCheckIn") {
    cancelCheckIn();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received:", message);

  if (message.type === "scheduleCheckIn") {
    const { ltoken, ltuid } = message;
    chrome.storage.local.set({ ltoken: ltoken, ltuid: ltuid }, () => {
      console.log("ltoken and ltuid saved");
    });
    scheduleImmediateCheckIn(ltoken, ltuid);
    scheduleDailyCheckIn();
  } else if (message.type === "cancelCheckIn") {
    cancelCheckIn();
  }
});

chrome.alarms.onAlarm.addListener(async function (alarm) {
  if (alarm.name === 'CheckIn') {
    chrome.storage.local.get(['ltoken', 'ltuid'], async (result) => {
      const ltoken = result.ltoken;
      const ltuid = result.ltuid;
      console.log(ltoken);
      console.log(ltuid);

      if (ltoken && ltuid) {
        await checkAndPerformCheckIn(ltoken, ltuid);
      }
    });
  }
});


// getUserInfo, checkAndPerformCheckIn 함수는 이전과 동일하게 유지합니다.

      async function getUserInfo(ltoken, ltuid) {
        const response = await fetch('https://api-account-os.hoyolab.com/binding/api/getUserGameRolesByLtoken?game_biz=hkrpg_global&region_name=Asia%20Server', {
          headers: {
            'ltoken': ltoken,
            'ltuid': ltuid,
          },
        });
        const data = await response.json();
        if (data.retcode === 0 && data.data && data.data.list) {
          return data.data.list; // 모든 게임 역할을 반환
        } else {
          return null;
        }
      }
      


      async function checkAndPerformCheckIn(ltoken, ltuid) {
        const userRoles = await getUserInfo(ltoken, ltuid);
        if (!userRoles) {
          throw new Error('Failed to get user info');
        }
        const checkInResponse = await fetch(`https://sg-public-api.hoyolab.com/event/luna/os/sign`, {
          method: 'POST',
          headers: {
            'User-Agent': navigator.userAgent,
            'Referer': 'https://act.hoyolab.com/bbs/event/signin/hkrpg/index.html?act_id=e202303301540311&hyl_auth_required=true&hyl_presentation_style=fullscreen&utm_source=hoyolab&utm_medium=notice&utm_campaign=checkin&utm_id=6',
            'Content-Type': 'application/json;charset=UTF-8',
            'ltoken': ltoken,
            'ltuid': ltuid
          },
          body: JSON.stringify({
            act_id: 'e202303301540311'
          })
        });


      console.log('Status Code:', checkInResponse.status); // 상태 코드 출력
      const checkInData = await checkInResponse.json();
      if (checkInData.retcode === 0) {
        //console.log('출석체크 성공!', checkInData);
        const today = new Date().toDateString();
        chrome.runtime.sendMessage({ type: "checkInCompleted" }); // 이 부분을 추가합니다.
        chrome.storage.local.set({ lastCheckInDate: today });
      } else if (checkInData.retcode === -5003) {
        console.log('이미 출석체크 완료.', checkInData);
        const today = new Date().toDateString();
        chrome.runtime.sendMessage({ type: "checkInCompleted" }); // 이 부분을 추가합니다.
        chrome.storage.local.set({ lastCheckInDate: today });
      } else {
        console.log(`출석체크 실패: ${checkInData.message}`);
        throw new Error('Check-in failed');
      }
    }
    
    
    
    
    // 완료 결과값
    // {"retcode":0,"message":"OK","data":{"code":"ok"}}
    // 이미 출석 완료
    // {"data":null,"message":"여행자, 이미 출석체크했어~","retcode":-5003}
  

