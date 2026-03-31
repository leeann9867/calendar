import React from 'react';

function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <div className="calendar-footer">
            <div>© {currentYear} My Calendar App. All rights reserved.</div>
        </div>
    );
}

export default Footer;