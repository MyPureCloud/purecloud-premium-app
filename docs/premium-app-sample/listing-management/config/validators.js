/**
 * This will contain all the validation rules for the fields
 */

 // TODO: Probably rename the file as it will be generified(?) (used by save listing to build
 // the JSON) and not jsut used for validation
export default {
    listingDetail: {
        name: {
            fieldId: "app-name",
            type: "input",
            maxChar: 20, 
            required: true,
            message: "Required. Maximum of 20 characters."
        },
        platforms: {
            fieldId: "app-platforms",
            type: "checkbox", 
            min: 1,
            message: "Select at least 1.",
            checkboxClass: 'cb-app-platform'
        },
        vendorName: {
            fieldId: "app-vendorName",
            type: "input", 
            required: true,
            message: "Required."
        },
        vendorWebSite: {
            fieldId: "app-vendorWebSite",
            type: "input", 
            required: true,
            format: 'website',
            message: "Invalid website."
        },
        vendorEmail: {
            fieldId: "app-vendorEmail",
            type: "input", 
            required: true,
            format: 'email',
            message: "Invalid email."
        },
        tagLine: {
            fieldId: "app-tagLine",
            type: "input", 
            required: true,
            maxChar: 100,
            message: "Required. Maximum of 100 characters."
        },
        shortDescription: {
            fieldId: "app-shortDescription",
            type: "textarea", 
            required: true,
            maxChar: 250,
            message: "Required. Maximum of 250 characters."
        },
        fullDescription: {
            fieldId: "app-fullDescription",
            type: "textarea", 
            required: true,
            maxChar: 2500,
            message: "Required. Maximum of 2500 characters.",
            markdown: true
        },
        videoURL: {
            fieldId: "app-videoURL",
            type: "input", 
            format: 'website',
            message: "Invalid URL."
        },
        helpDocumentation: {
            fieldId: "app-helpDocumentation",
            type: "input", 
            format: 'website',
            message: "Invalid URL."
        },
        appLanguages: {
            fieldId: "app-appLanguages",
            type: "checkbox", 
            min: 1,
            message: "Select at least 1.",
            checkboxClass: 'cb-appLanguages'
        },
        industries: {
            fieldId: "app-industries",
            type: "checkbox", 
            min: 1,
            message: "Select at least 1.",
            checkboxClass: 'cb-app-industries'
        },
        sellingParty: {
            fieldId: "app-sellingParty",
            type: "radio",
            required: true,
            message: "Required.",
            radioName: 'rdo-app-sellingParty'
        },
        licensingClassifications: {
            fieldId: "app-licensingClassifications",
            type: "checkbox", 
            min: 1,
            message: "Select at least 1.",
            checkboxClass: 'cb-app-licensing'
        },
        appPermissions: {
            fieldId: "app-appPermissions",
            type: "input", 
            message: ""
        },
        attestations: {
            fieldId: "app-attestations",
            type: "checkbox", 
            message: "Select at least 1.",
            checkboxClass: 'cb-app-attestations'
        },
        appType: {
            fieldId: "app-appType",
            type: "checkbox", 
            min: 1,
            message: "Select at least 1.",
            checkboxClass: 'cb-app-appType'
        }
    },
    premiumAppDetails: {
        description: {
            fieldId: "p-app-description",
            type: "input",
            required: true,
            maxChar: 75,
            message: "Required. Max of 75 characters."
        },
        helpURL: {
            fieldId: "p-app-helpURL",
            type: "input",
            format: 'website',
            required: true,
            message: "Required. Should be a valid URL"
        },
        defaultApplicationURL: {
            fieldId: "p-app-defaultApplicationURL",
            type: "input",
            format: 'website',
            required: true,
            message: "Required. Should be a valid URL"
        },
        uniquePermissions: {
            fieldId: "p-app-uniquePermissions",
            type: "input",
            required: true,
            message: "Required."
        },
        defaultSandboxOptions: {
            fieldId: "p-app-defaultSandboxOptions",
            type: "checkbox",
            message: '',
            checkboxClass: 'cb-p-app-defaultSandboxOptions',
        },
        applicationLocation: {
            fieldId: "p-app-applicationLocation",
            type: "radio",
            required: true,
            message: 'Required.',
            radioName: 'rdo-p-app-applicationLocation'
        },
        hostedAppIcon: {
            fieldId: "p-app-hostedAppIcon",
            type: "input",
            format: 'website',
            required: true,
            message: "Required. MUST be vendor hosted URL."
        },
        regionalOAuthGrantType: {
            fieldId: "p-app-regionalOAuthGrantType",
            type: "radio",
            required: true,
            message: 'Required.',
            radioName: 'rdo-p-app-regionalOAuthGrantType'
        },
        tosURL: {
            fieldId: "p-app-tosURL",
            type: "input",
            format: 'website',
            required: true,
            message: "Required. Should be a valid URL"
        },
        faq: {
            fieldId: "p-app-faq",
            type: "input",
            format: 'website',
            message: 'Should be a valid URL'
        },
        privacyPolicy: {
            fieldId: "p-app-privacyPolicy",
            type: "input",
            format: 'website',
            message: 'Should be a valid URL'
        },
        supportContact: {
            fieldId: "p-app-supportContact",
            type: "input",
            format: 'email',
            message: 'Should be a valid Email'
        },
        salesContact: {
            fieldId: "p-app-salesContact",
            type: "input",
            format: 'email',
            message: 'Should be a valid Email'
        },
        additionalHelpURLs: {
            fieldId: "p-app-additionalHelpURLs",
            type: "input"
        }
    },
    attachments: {
        companyLogo: {
            fieldId: 'app-companyLogo',
            required: true,
            minWidth: 144,
            minHeight: 144,
            fileType: 'png',
            type: 'image',
            message: 'Required. Should be .png (Min. size of 144x144 px)',
            required: true,
            forPremium: false
        },
        screenshots: {
            fieldId: 'app-screenshots',
            ratio: '4x3',
            minWidth: 1024,
            minHeight: 768,
            fileType: 'png',
            maxFiles: 4,
            manyFiles: true,
            type: 'image',
            message: 'Max 4 images. PNG only. Aspect ratio 4:3 only. Minimum dimension of 1024x768',
            required: true,
            forPremium: false
        },
        brochure: {
            fieldId: 'app-brochure',
            fileType: 'pdf',
            type: 'document',
            message: 'PDF file only.',
            forPremium: false
        },
        premiumAppIcon: {
            fieldId: 'p-app-icon',
            required: true,
            fileType: 'svg\\+xml',
            type: 'image',
            message: 'Required. Must be 1:1. MUST have transparent background.',
            forPremium: true
        }
    }
}