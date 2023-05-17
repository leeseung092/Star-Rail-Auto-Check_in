// popup.js
console.log("popup.js 돌아감");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "checkInCompleted") {
    updateCheckInDate();
  }
});
// hoyolab 쿠키 가져오기.. 만약 쿠키값이 null이면 새로운 탭을 열어서 https://hoyolab.com 으로 이동하게 만듬.
  function getCookies() {
    return new Promise((resolve) => {
      chrome.cookies.get({ "url": "https://hoyolab.com", "name": "ltuid" }, cookie1 => {
        chrome.cookies.get({ "url": "https://hoyolab.com", "name": "ltoken" }, cookie2 => {
          if (cookie1 && cookie2) {
            resolve({ ltoken: cookie1.value, ltuid: cookie2.value });
          } else {
            alert("hoyolab 페이지에 로그인하세요. 로그인 한 후 다시 활성화 비활성화 버튼을 누르세요.");
            window.open("https://hoyolab.com");
            resolve({ ltoken: null, ltuid: null });
          }
        });
      });
    });
  }

//마지막 출석체크 날짜 업데이트 로직.
async function updateCheckInDate() {
  const lastCheckIn = await getLastCheckIn();
  if (lastCheckIn) {
    const checkInTime = new Date(lastCheckIn);
    checkInDate.textContent = `${checkInTime.getMonth() + 1}월 ${checkInTime.getDate()}일 출석 완료`;
  } else {
    checkInDate.textContent = '';
  }
}

async function getLastCheckIn() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['lastCheckInDate'], (result) => {
      resolve(result.lastCheckInDate);
    });
  });
}



async function updateToggleButtonState() {
  const activationState = await getActivationState();
  if (activationState) {
    toggleCheckInButton.textContent = '자동출석 비활성화';
  } else {
    toggleCheckInButton.textContent = '자동출석 활성화';
  }
}

// 활성화 상태 가져오기.
async function getActivationState() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['activated'], (result) => {
      resolve(result.activated);
    });
  });
}



document.addEventListener('DOMContentLoaded', async () => {
  const toggleCheckInButton = document.getElementById('toggleCheckInButton');
  const checkInStatus = document.getElementById('checkInStatus');
  const checkInDate = document.getElementById('checkInDate');

  // 최종 출석체크 날짜 업데이트
  await updateCheckInDate();

  // 활성화 상태를 가져오고 버튼 텍스트를 설정합니다.
  await updateToggleButtonState();
  
  toggleCheckInButton.addEventListener('click', async () => {

    if (toggleCheckInButton.textContent === '자동출석 활성화') {
      const { ltoken, ltuid } = await getCookies();
      if (ltoken && ltuid) {
        chrome.runtime.sendMessage({ type: 'scheduleCheckIn', ltoken, ltuid });
        chrome.storage.local.set({ activated: true }); // 버튼 활성화 상태 저장
        toggleCheckInButton.textContent = '자동출석 비활성화';
        checkInStatus.textContent = '';
        await updateCheckInDate();
      } else {
        console.log("ltoken 또는 ltuid 값이 쿠키에서 찾을 수 없습니다.");
      }
    } else {
      chrome.runtime.sendMessage({ type: 'cancelCheckIn' });
      chrome.storage.local.set({ activated: false }); // 버튼 활성화 상태 저장
      toggleCheckInButton.textContent = '자동출석 활성화';
      checkInStatus.textContent = '자동 출석이 비활성화되었습니다.';
      checkInDate.textContent = '';
    }
  });
});



  