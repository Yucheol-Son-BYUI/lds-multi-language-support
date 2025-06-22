"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// ==UserScript==
// @name         LDS bible multi-language support
// @namespace    http://tampermonkey.net/
// @version      2025-06-20
// @description  Read the multi-language versions of LDS scriptures simultaneously
// @author       Yucheol Arthur Son
// @match        https://www.churchofjesuschrist.org/study/scriptures*
// @match        https://www.churchofjesuschrist.org/study/general-conference/*/*/*
// @match        https://www.churchofjesuschrist.org/study/liahona/*/*/*
// @icon         https://www.churchofjesuschrist.org/services/platform/v4/resources/static/image/favicon.ico
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==
(function () {
    return __awaiter(this, void 0, void 0, function* () {
        'use strict';
        class Section {
            constructor(title, intro, summary, verses) {
                this.title = title;
                this.intro = intro;
                this.summary = summary;
                this.verses = verses;
            }
        }
        class Liahona {
            constructor(title, author, kicker, contents) {
                this.title = title;
                this.author = author;
                this.kicker = kicker;
                this.contents = contents;
            }
        }
        class GeneralConference {
            constructor(title, intro, summary, verses) {
                this.title = title;
                this.intro = intro;
                this.summary = summary;
                this.verses = verses;
            }
        }
        const DEFAULT_LANG = 'kor';
        let lang = yield GM_getValue('lang', DEFAULT_LANG);
        GM_registerMenuCommand(`Set Scripture Language (current: ${lang})`, () => __awaiter(this, void 0, void 0, function* () {
            const choice = prompt('Choose language code(in the url, lang=???):\nex) eng, kor, jpn', lang);
            if (!choice)
                return;
            lang = choice;
            yield GM_setValue('lang', lang);
            location.reload();
        }));
        function parseLiahonaHrefLang(liahona, lang = "eng") {
            liahona.title = liahona.title.replace(/([?&]lang=)[^&#]+/, `$1${lang}`);
            liahona.author = liahona.author.replace(/([?&]lang=)[^&#]+/, `$1${lang}`);
            liahona.kicker = liahona.kicker.replace(/([?&]lang=)[^&#]+/, `$1${lang}`);
            liahona.contents = liahona.contents.map(c => c.replace(/([?&]lang=)[^&#]+/, `$1${lang}`));
        }
        function getUrl(lang = "kor") {
            const url = new URL(location.href);
            url.searchParams.set('lang', lang);
            return url.toString();
        }
        // Bible
        function getSection() {
            const getParagraphWithClass = (cls) => {
                const element = document.querySelector(`p.${cls}`);
                return element ? element.outerHTML : "";
            };
            const verses = Array.from(document.querySelectorAll('p.verse'))
                .map(e => e.outerHTML);
            return new Section(getParagraphWithClass("title-number"), getParagraphWithClass("study-intro"), getParagraphWithClass("study-summary"), verses);
        }
        function fetchSection() {
            return __awaiter(this, arguments, void 0, function* (lang = "kor") {
                // parsing translated-page
                const korUrl = getUrl(lang);
                const res = yield fetch(korUrl, { credentials: 'same-origin' });
                const html = yield res.text();
                const doc = new DOMParser().parseFromString(html, "text/html");
                const getParagraphWithClass = (cls) => {
                    const element = doc.querySelector(`p.${cls}`);
                    return element ? element.outerHTML : "";
                };
                const verses = Array.from(doc.querySelectorAll('p.verse'))
                    .map(e => e.outerHTML);
                return new Section(getParagraphWithClass("title-number"), getParagraphWithClass("study-intro"), getParagraphWithClass("study-summary"), verses);
            });
        }
        function renderSections(original, translated) {
            const rows = [
                `
      <tr class="title">
        <td>${original.title}</td>
        <td>${translated.title}</td>
      </tr>
      <tr class="intro">
        <td>${original.intro}</td>
        <td>${translated.intro}</td>
      </tr>
      <tr class="summary">
        <td>${original.summary}</td>
        <td>${translated.summary}</td>
      </tr>`
            ];
            for (let i = 0; i < original.verses.length; i++) {
                rows.push(`
        <tr class="verse">
          <td>${original.verses[i]}</td>
          <td>${translated.verses[i]}</td>
        </tr>
      `);
            }
            let style = `
      <style>
        #generated-bible{
          table-layout: fixed;
          width:80%;
          box-sizing: border-box;
          margin: 5rem auto;

          font-size: 18px;
          font-family: "Ensign:Serif", McKay, "McKay ldsLat", Palatino, "Palatino Linotype", Palatino-Roman, Pahoran, "Pahoran ldsLat", "Noto Sans Myanmar", NotoSansMyanmar, SaysetthaldsLao, NotoSerifTamil, serif;
          
          
          tr.title td{
            font-size: 42px;
            text-align: center;
          }
          tr.intro td{
            font-style: italic;
          }
          tr.summary td{
            font-style: italic;
          }

          td{
            width:50%;
            max-width:40rem;
            box-sizing: border-box;
            min-width:10rem;
            padding: 0.5rem 2rem;
          }
        }
      </style>
    `;
            return `
      ${style}
      <table id="generated-bible">
        <tbody>
          ${rows.join("\n")}
        </tbody>
      </table>
    `;
        }
        // Liahona
        function getLiahona(doc = document) {
            const getOuterHTML = (selector) => {
                const el = doc.querySelector(selector);
                return el ? el.outerHTML : "";
            };
            const contents = [];
            // select allowed tags in div.body-block
            function _extractContents(node) {
                const allowed = new Set(['P', 'H2', 'ASIDE', 'FIGURE', 'IMG']);
                node.childNodes.forEach(child => {
                    if (child.nodeType !== Node.ELEMENT_NODE)
                        return; //check only if tags
                    const element = child;
                    if (allowed.has(element.tagName.toUpperCase())) {
                        contents.push(element.outerHTML);
                    }
                    else {
                        _extractContents(element);
                    }
                });
            }
            const body = doc.querySelector('div.body-block');
            if (body) {
                _extractContents(body); // add contents to contents[]
            }
            let liahona = new Liahona(getOuterHTML('div.body > header > h1'), getOuterHTML('div.body > header p.author-name'), getOuterHTML('div.body > header > p.kicker'), contents);
            return liahona;
        }
        function fetchLiahona() {
            return __awaiter(this, arguments, void 0, function* (lang = "kor") {
                // parsing translated-page
                const korUrl = getUrl(lang);
                const res = yield fetch(korUrl, { credentials: 'same-origin' });
                const html = yield res.text();
                const doc = new DOMParser().parseFromString(html, "text/html");
                let liahona = getLiahona(doc);
                parseLiahonaHrefLang(liahona, "eng");
                return liahona;
            });
        }
        function renderLiahonas(original, translated) {
            const rows = [
                `
      <tr class="title">
        <td>${original.title}</td>
        <td>${translated.title}</td>
      </tr>
      <tr class="intro">
        <td>${original.author}</td>
        <td>${translated.author}</td>
      </tr>
      <tr class="summary">
        <td>${original.kicker}</td>
        <td>${translated.kicker}</td>
      </tr>`
            ];
            for (let i = 0; i < original.contents.length; i++) {
                rows.push(`
        <tr class="verse">
          <td>${original.contents[i]}</td>
          <td>${translated.contents[i]}</td>
        </tr>
      `);
            }
            let style = `
      <style>
        #generated-bible{
          table-layout: fixed;
          width:80%;
          box-sizing: border-box;
          margin: 5rem auto;

          font-size: 18px;
          font-family: "Ensign:Serif", McKay, "McKay ldsLat", Palatino, "Palatino Linotype", Palatino-Roman, Pahoran, "Pahoran ldsLat", "Noto Sans Myanmar", NotoSansMyanmar, SaysetthaldsLao, NotoSerifTamil, serif;
          
          
          tr.title td{
            font-size: 42px;
            text-align: center;
          }
          tr.intro td{
            font-style: italic;
          }
          tr.summary td{
            font-style: italic;
          }

          td{
            width:50%;
            max-width:40rem;
            box-sizing: border-box;
            min-width:10rem;
            padding: 0.5rem 2rem;
          }
          img{
            width:100%;
            height:fit-content;
          }
        }
      </style>
    `;
            return `
      ${style}
      <table id="generated-bible">
        <tbody>
          ${rows.join("\n")}
        </tbody>
      </table>
    `;
        }
        // General Conference 
        function getGeneralConference() {
            const getParagraphWithClass = (cls) => {
                const element = document.querySelector(`p.${cls}`);
                return element ? element.outerHTML : "";
            };
            const verses = Array.from(document.querySelectorAll('p.verse'))
                .map(e => e.outerHTML);
            return new GeneralConference(getParagraphWithClass("title-number"), getParagraphWithClass("study-intro"), getParagraphWithClass("study-summary"), verses);
        }
        function fetchGeneralConference() {
            return __awaiter(this, arguments, void 0, function* (lang = "kor") {
                // parsing translated-page
                const korUrl = getUrl(lang);
                const res = yield fetch(korUrl, { credentials: 'same-origin' });
                const html = yield res.text();
                const doc = new DOMParser().parseFromString(html, "text/html");
                const getParagraphWithClass = (cls) => {
                    const element = doc.querySelector(`p.${cls}`);
                    return element ? element.outerHTML : "";
                };
                const verses = Array.from(doc.querySelectorAll('p.verse'))
                    .map(e => e.outerHTML);
                return new GeneralConference(getParagraphWithClass("title-number"), getParagraphWithClass("study-intro"), getParagraphWithClass("study-summary"), verses);
            });
        }
        function renderGeneralConferences(original, translated) {
            const rows = [
                `
      <tr class="title">
        <td>${original.title}</td>
        <td>${translated.title}</td>
      </tr>
      <tr class="intro">
        <td>${original.intro}</td>
        <td>${translated.intro}</td>
      </tr>
      <tr class="summary">
        <td>${original.summary}</td>
        <td>${translated.summary}</td>
      </tr>`
            ];
            for (let i = 0; i < original.verses.length; i++) {
                rows.push(`
        <tr class="verse">
          <td>${original.verses[i]}</td>
          <td>${translated.verses[i]}</td>
        </tr>
      `);
            }
            let style = `
      <style>
        #generated-bible{
          table-layout: fixed;
          width:80%;
          box-sizing: border-box;
          margin: 5rem auto;

          font-size: 18px;
          font-family: "Ensign:Serif", McKay, "McKay ldsLat", Palatino, "Palatino Linotype", Palatino-Roman, Pahoran, "Pahoran ldsLat", "Noto Sans Myanmar", NotoSansMyanmar, SaysetthaldsLao, NotoSerifTamil, serif;
          
          
          tr.title td{
            font-size: 42px;
            text-align: center;
          }
          tr.intro td{
            font-style: italic;
          }
          tr.summary td{
            font-style: italic;
          }

          td{
            width:50%;
            max-width:40rem;
            box-sizing: border-box;
            min-width:10rem;
            padding: 0.5rem 2rem;
          }
          img{
            width:100%;
            height:fit-content;
          }
        }
      </style>
    `;
            return `
      ${style}
      <table id="generated-bible">
        <tbody>
          ${rows.join("\n")}
        </tbody>
      </table>
    `;
        }
        // To detect Routing by React
        function runScripture() {
            return __awaiter(this, void 0, void 0, function* () {
                const original_Section = getSection();
                const translated_Section = yield fetchSection(lang);
                const wrapper = document.querySelector('div[class^="contentWrapper-"]');
                if (wrapper) {
                    wrapper.innerHTML = renderSections(original_Section, translated_Section);
                }
            });
        }
        function runGeneralConference() {
            return __awaiter(this, void 0, void 0, function* () {
                const original_GeneralConference = getGeneralConference();
                const translated_GeneralConference = yield fetchGeneralConference(lang);
                const wrapper = document.querySelector('div[class^="contentWrapper-"]');
                if (wrapper) {
                    wrapper.innerHTML = renderGeneralConferences(original_GeneralConference, translated_GeneralConference);
                }
            });
        }
        function runLiahona() {
            return __awaiter(this, void 0, void 0, function* () {
                const original_Liahona = getLiahona();
                const translated_Liahona = yield fetchLiahona(lang);
                const wrapper = document.querySelector('div[class^="contentWrapper-"]');
                if (wrapper) {
                    wrapper.innerHTML = renderLiahonas(original_Liahona, translated_Liahona);
                }
            });
        }
        // 1) popstate handling
        function onUrlChange() {
            console.log('URL changed to', location.href);
            location.reload();
        }
        window.addEventListener('popstate', onUrlChange);
        // trig popState manually when React changed the URL
        const origPush = history.pushState;
        history.pushState = function (...args) {
            origPush.apply(this, args);
            window.dispatchEvent(new Event('popstate'));
        };
        const origReplace = history.replaceState;
        history.replaceState = function (...args) {
            origReplace.apply(this, args);
            window.dispatchEvent(new Event('popstate'));
        };
        const path = location.pathname;
        const url = new URL(location.href);
        if (url.searchParams.get('lang') != lang) {
            if (path.startsWith('/study/scriptures')) {
                runScripture();
            }
            else if (path.startsWith('/study/general-conference')) {
                runGeneralConference();
            }
            else if (path.startsWith('/study/liahona')) {
                runLiahona();
            }
        }
    });
})();
