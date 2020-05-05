let t = document.createElement('template');

t.innerHTML =
`
<div class="row">        
    <div class="col-md-4">
        <h2>Provision Telephony</h2>
        <p>Setup your telephony in an instant. Choose between Twillio or Nexmo</p>
        <p><button type="submit" id="btnProvisionTelephony" class="btn btn-success-modified">Start »</button></p>
    </div>

    <div class="col-md-4">
        <h2>Architect Flow</h2>
        <p>Here's a downloadable architect flow for your Org which you can import and use to setup Architect Flow
        seamlessly.</p>
        <p><button type="submit" id="btnInitiateArchitectDownload" class="btn btn-success-modified">Start »</button></p>
    </div>
    
    <div class="col-md-4">
        <h2>Developer role</h2>
        <p> Generate an admin role and assign your current user to it.</p>
        <p><button type="submit" id="btnDeveloperRole" class="btn btn-success-modified">Start »</button></p>
    </div>
</div>
`;

export default {
    new(){
        // Crete element
        const element = document.importNode(t.content, true);

        return element;
    }
};