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
// @match        https://www.churchofjesuschrist.org/study/scriptures/*
// @icon         https://www.churchofjesuschrist.org/services/platform/v4/resources/static/image/favicon.ico
// @grant        none
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
        function getUrl(lang = "kor") {
            const url = new URL(location.href);
            url.searchParams.set('lang', lang);
            return url.toString();
        }
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

          font-size: 1.2rem;
          font-family: "Ensign:Serif", McKay, "McKay ldsLat", Palatino, "Palatino Linotype", Palatino-Roman, Pahoran, "Pahoran ldsLat", "Noto Sans Myanmar", NotoSansMyanmar, SaysetthaldsLao, NotoSerifTamil, serif;
          
          
          tr.title td{
            font-size: 1.5rem;
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
        const original_Section = getSection();
        const translated_Section = yield fetchSection("kor");
        // console.log(original_Section)
        // console.log(translated_Section)
        // console.log(renderSections(original_Section, translated_Section))
        // const wrapper = document.querySelector<HTMLDivElement>('div[class^="contentWrapper-"]'); // className of React
        // if (wrapper) {
        //   wrapper.innerHTML = renderSections(original_Section, translated_Section);
        // }
        // To detect Routing by React
        function run() {
            return __awaiter(this, void 0, void 0, function* () {
                const original_Section = getSection();
                const translated_Section = yield fetchSection("kor");
                const wrapper = document.querySelector('div[class^="contentWrapper-"]');
                if (wrapper) {
                    wrapper.innerHTML = renderSections(original_Section, translated_Section);
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
        run();
    });
})();
