let t = document.createElement('template');
t.innerHTML =
`
<div class="modal fade" id="userModal">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <!-- Modal Header -->
            <div class="modal-header">
                <h3 id="modalTitle">Make Developer</h3>         
                <button type="button" class="close" data-dismiss="modal">×</button>
            </div>
            <div class="modal-body">
                <label>User List:</label>
                <select type="text" class="form-control" id="selectUser">
                <option selected>Select User</option>
                </select>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-success-modified" id="makeDeveloper" data-dismiss="modal" data-toggle="modal">Submit</button>
            </div>
        </div>
    </div>
</div>
`;

export default {
    new(){
        return document.importNode(t.content, true);
    },

    show(){
        $("#userModal").modal(); 
    }
};