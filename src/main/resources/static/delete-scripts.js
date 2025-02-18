document.getElementById('delete-button').addEventListener('click', function() {
    document.getElementById('delete-button').style.display = 'none';
    document.getElementById('cancel-delete-button').style.display = 'inline-block';
});

document.getElementById('cancel-delete-button').addEventListener('click', function() {
    document.getElementById('cancel-delete-button').style.display = 'none';
    document.getElementById('delete-button').style.display = 'inline-block';
});