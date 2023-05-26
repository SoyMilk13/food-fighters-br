function toggleSidebarUi(value, target) {
    // Close other pages
    let pages = ['shopUi', 'cosmeticsUi', 'questsUi', 'statsUi'];
    pages.forEach((id) => {
        document.getElementById(`${id}`).style.display = 'none';
    });

    // Determine what action to perform
    let close = value == 0;
    if (close) return target.style.display = 'none';
    
    target.style.display = 'block';
};