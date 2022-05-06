/**
 * This module manages loading the language files and dynamically changing languages
 * on the wizard
 */
import config from '../config/config.js';
import view from './view.js';
import localizedLabels from '../assets/languages/languages.js';

let dropDownConfigured = false;
let currentLanguageCode = null;

/**
 * Configure the language selector dropdown
 * @param {String} currentlySelected language key that's selected
 */
function setupDropdownSelector(currentlySelected) {
    // Check configuration if language selection enabled
    if (!config.enableLanguageSelection) {
        view.hideLanguageSelection();
        return;
    }

    const selectorDropdown = $("#language-select");
    if (!selectorDropdown) return;

    // Add languages to the drop down selector
    Object.keys(config.availableLanguageAssets).forEach(langKey => {
        const newOption = `<option value="${langKey}" ${currentlySelected === langKey ? 'selected' : ''}>${config.availableLanguageAssets[langKey]}</option>`;

        selectorDropdown.append(newOption);
    });

    // When a new language is selected
    selectorDropdown.on('change', function () {
        const selectedLang = this.value;
        setPageLanguage(selectedLang)
            .then(() => {
                console.log('Localization applied: ', selectedLang);
            })
            .catch((e) => {
                console.error(e);
            });
    });

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
    currentLanguageCode = requestedLanguage.toLowerCase().replace('_', '-');
    if (Object.keys(config.availableLanguageAssets).includes(currentLanguageCode) === false) {
        currentLanguageCode = currentLanguageCode.split('-')[0];
        if (Object.keys(config.availableLanguageAssets).includes(currentLanguageCode) === false) {
            currentLanguageCode = config.defaultLanguage;
        }
    }

    if (!localizedLabels.hasOwnProperty(currentLanguageCode)) {
        currentLanguageCode = config.defaultLanguage;
    }

    // Configure the drop down selector
    if (!dropDownConfigured) setupDropdownSelector(currentLanguageCode);

    localizePage();
    return true;
}

export function getSelectedLanguage() {
    return currentLanguageCode;
}

export function localizePage() {
    if (localizedLabels[currentLanguageCode]) {
        Object.keys(localizedLabels[currentLanguageCode]).forEach((key) => {
            $(`.${key}`).text(localizedLabels[currentLanguageCode][key]);
        });
    } else {
        console.log('Language not found.');
    }
}

/**
 * Gets the string text from the translations files.
 * @param {String} key The key for the entry in the JSON file
 * @returns {String} the translated text
 */
export function getTranslatedText(key) {
    if (localizedLabels[currentLanguageCode] && localizedLabels[currentLanguageCode][key]) {
        return localizedLabels[currentLanguageCode][key];
    } else {
        console.log('Language Label not found.');
        return '';
    }
}
