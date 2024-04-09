const openPopupTx = () => {
  document.getElementById('modal_tx').showModal();
}

const openPopupMetamask = () => {
  document.getElementById('modal_metamask').showModal();
}

const simpleNum = (num) => {
  const a = Math.floor(Number(num) * 100);
  return (a / 100);
}

const openUrl = (url, otherTab) => {
  if (otherTab)
    window.open(url, '_blank');
  else
    window.open(url, '_self');
}

const refreshPage = () => {
  window.location.reload();
}

const secsToText = (secs) => {
  let s = secs;
  const h = Math.floor(s / 3600);
  s = s - (h * 3600);
  const m = Math.floor(s / 60);
  s = s - (m * 60);
  const hh = (h + '').padStart(2, '0');
  const mm = (m + '').padStart(2, '0');
  const ss = (s + '').padStart(2, '0');
  return hh + ':' + mm + ':' + ss;
}

const delay = async (ms) => {
  console.log('wait for ' + (ms / 1000) + ' secs...');
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

async function getStorageValue(key) {
  const val = window.localStorage.getItem(key);
  return val;
}

async function setStorageValue(key, val) {
  window.localStorage.setItem(key, val);
}

async function clearStorageValue() {
  window.localStorage.clear();
}

function getBaseURL() {
  const ret = window.location.protocol + '//' + window.location.host;
  return ret;
}

// console.log(getBaseURL());

module.exports = {
  getBaseURL,
  openUrl,
  refreshPage,
  openPopupTx,
  openPopupMetamask,
  simpleNum,
  secsToText,
  delay,
  getStorageValue,
  setStorageValue,
  clearStorageValue
}