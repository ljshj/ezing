/*
 * Copyright (C) 2015 Actor LLC. <https://actor.im>
 */

import russian from './ru-RU';
import english from './en-US';
import spanish from './es-ES';
import portuguese from './pt-BR';
import chinese from './zh-CN';

let language = navigator.language.toLocaleLowerCase() || navigator.browserLanguage.toLocaleLowerCase();
if (language === 'zh-cn') {
  language = 'zh'
}

// Intl polyfill
if (!global.Intl) {
  const request = new XMLHttpRequest();
  const url = window.location.href;
  const arr = url.split('/');
  const localeDataPath = arr[0] + '//' + arr[2] + '/' + arr[3] + '/assets/locale-data/' + language + '.json';
//https://www.ezing.cn/app/index.html#/auth?nextPath=%2F
  require('intl');

  function addLocaleData() {
    IntlPolyfill.__addLocaleData(JSON.parse(this.response));
  }

  request.addEventListener('load', addLocaleData);
  request.open('GET', localeDataPath);
  request.send();
}

// Set language data
const languageData = {
  'ru': russian,
  'en': english,
  'es': spanish,
  'pt': portuguese,
  'zh': chinese
};

const intlData = languageData[language] || languageData[language.split('-')[0]] || languageData['en'];

export default { intlData };
