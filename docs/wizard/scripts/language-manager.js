/**
 * This module manages loading the language files and dynamically changing languages
 * on the wizard
 */
import config from '../config/config.js';
import view from './view.js';

let dropDownConfigured = false;
let currentLanguageSet = null; // Contains the currently loaded language file (Object)

/**
 * Configure the language selector dropdown
 * @param {String} currentlySelected language key that's selected
 */
function setupDropdownSelector(currentlySelected){
    // Check configuration if language selection enabled
    if(!config.enableLanguageSelection){
        view.hideLanguageSelection();
        return;
    }

    const elemDropdown = document.getElementById('language-select');
    if(!elemDropdown) return;

    // Add languages to the drop down selector
    Object.keys(config.availableLanguageAssets).forEach(langKey => {
        const newOption = document.createElement('option');
        newOption.value = langKey;
        newOption.selected = currentlySelected === langKey;
        newOption.innerText = config.availableLanguageAssets[langKey];

        elemDropdown.appendChild(newOption);
    });

    // When a new language is selected
    elemDropdown.addEventListener('change', function () {
        const selectedLang = elemDropdown.options[elemDropdown.selectedIndex].value;
        setPageLanguage(selectedLang)
            .then(() => {
                console.log('Localization applied: ', selectedLang);
            })
            .catch((e) => {
                console.error(e);
            });
    })

    dropDownConfigured = true;
}

/**
 * Sets and loads the language file based on the requestedLanguage parameter
 * @returns {Promise}
 */
export async function setPageLanguage(requestedLanguage) {
    // Manage pcLangTag with possible formats like: en, en-US, en_US, en-CA, en_CA, ...
    // Transform: replace _ with -, tolowercase
    // Check en-us, en-ca, ... - if not found, check en - if not found, use default language
    let langAssetCode = requestedLanguage.toLowerCase().replace('_', '-');
    if (Object.keys(config.availableLanguageAssets).includes(langAssetCode) === false) {
        langAssetCode = langAssetCode.split('-')[0];
        if (Object.keys(config.availableLanguageAssets).includes(langAssetCode) === false) {
            langAssetCode = config.defaultLanguage;
        }
    }

    // Configure the drop down selector
    if(!dropDownConfigured) setupDropdownSelector(langAssetCode);

    return new Promise((resolve, reject) => {
        let fileUri = `${config.wizardUriBase}assets/languages/${langAssetCode}.json`;
        $.getJSON(fileUri)
            .done(data => {
                currentLanguageSet = data;
                Object.keys(data).forEach((key) => {
                    let els = document.querySelectorAll(`.${key}`);
                    for (let i = 0; i < els.length; i++) {
                        els.item(i).innerText = data[key];
                    }
                })
                resolve();
            })
            .fail(xhr => {
                console.log('Language file not found.');
                resolve();
            });
    });
}

/**
 * Gets the string text from the translations files.
 * @param {String} key The key for the entry in the JSON file
 * @returns {String} the translated text
 */
export function getTranslatedText(key){
    return currentLanguageSet[key];
}
