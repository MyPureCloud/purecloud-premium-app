let t = document.createElement('template');
t.innerHTML =
`
<div class="alert alert-primary devfoundry-note">
    <article class="media">
    <div class="media-content">
        <div class="note-from"><em>From:</em> <span class="from"></span></div>
        <div class="note-time"><span class="note-timestamp"></span></div>
        <em>Message:</em><br>
        <span class="devfoundry-note-message"></span>
    </div>
    </article>
</div>
`;

export default {
    new(note){
        let el = document.importNode(t.content, true);
        let elFrom = el.querySelectorAll('.from')[0];
        let elTimestamp = el.querySelectorAll('.note-timestamp')[0];
        let elNoteMessage = el.querySelectorAll('.devfoundry-note-message')[0];

        elFrom.innerText = note.user;
        elTimestamp.innerText = note.timestamp;
        elNoteMessage.innerText = note.message;

        return el;
    }
};