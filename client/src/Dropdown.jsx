import React, { useState } from "react";

function Dropdown({onSelect, activeItem, items}) { // props, values are received from parent
    const [dropdownVisible, setDropdownVisible] = useState(false);

    const selectItem = (e, item) => {
        e.preventDefault();
        setDropdownVisible(!dropdownVisible); // when token has been selected, close dropdown
        onSelect(item);
    }


    return (
        <div className="dropdown ml-3">
            {console.log('Dropdown.jsx: ', items)}
            <button
                className="btn btn-secondary dropdown-toggle"
                type="button"
                onClick={() => setDropdownVisible(!dropdownVisible)}
            >
                {activeItem.label}
            </button>
            <div className={`dropdown-menu ${dropdownVisible ? 'visible' : ''}`}>
                {items && items.map((item, index) => (
                    <a
                        className={`dropdown-item ${item.value === activeItem.value ? 'active' : null}`}
                        href="#"
                        key={index}
                        onClick={e => selectItem(e, item.value)}
                    >
                        {item.label}
                    </a>
                ))}
            </div>
        </div>
    );
}

export default Dropdown;