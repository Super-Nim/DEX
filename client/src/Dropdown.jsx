import React, { useState } from "react";
import { useMoralisCloudFunction } from "react-moralis";


function Dropdown({web3, onSelect, activeItem, items}) { // props, values are received from parent
    const getPrice = useMoralisCloudFunction("getPrice", "0x4E15361FD6b4BB609Fa63C81A2be19d873717870");
    const [dropdownVisible, setDropdownVisible] = useState(false);

    const selectItem = async (e, item) => {
        console.log('result: ', getPrice);
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