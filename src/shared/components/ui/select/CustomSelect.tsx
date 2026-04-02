import React from 'react';
import Select, { ActionMeta, SingleValue, StylesConfig } from 'react-select';
import makeAnimated from 'react-select/animated';

export interface SelectOption {
    value: string;
    label: string;
}

type SingleSelectChange = (
    newValue: SingleValue<SelectOption>,
    actionMeta: ActionMeta<SelectOption>
) => void;

interface CustomSelectProps {
    id: string;
    value: SelectOption | null;
    onChange: (value: SelectOption | null) => void;
    options: SelectOption[];
    placeholder?: string;
    isDisabled?: boolean;
    required?: boolean;
}

const selectCustomStyles: StylesConfig<SelectOption, false> = {
    menuPortal: (base) => ({
        ...base,
        zIndex: 2000
    }),
    menu: (provided) => ({
        ...provided,
        position: 'absolute' as 'absolute',
        zIndex: 2000,
    }),
    control: (provided, state) => ({
        ...provided,
        minHeight: '40px',
        borderRadius: '8px',
        border: `1px solid ${state.isFocused ? '#0066ff' : '#ccc'}`,
        boxShadow: state.isFocused ? '0 0 0 1px #0066ff' : 'none',
        '&:hover': {
            borderColor: '#0066ff',
        }
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isFocused ? 'rgba(0, 102, 255, 0.1)' : 'white',
        color: '#1a1a1a',
        cursor: 'pointer',
        padding: '12px 20px',
        transition: 'background-color 0.2s',
    }),
    indicatorSeparator: (provided) => ({
        ...provided,
        backgroundColor: '#ddd',
    }),
};

const animatedComponents = makeAnimated();

export const CustomSelect: React.FC<CustomSelectProps> = ({
                                                              id,
                                                              value,
                                                              onChange,
                                                              options,
                                                              placeholder,
                                                              isDisabled = false,
                                                          }) => {
    const handleSelectChange: SingleSelectChange = (newValue, _actionMeta) => {
        onChange(newValue);
    };

    return (
        <Select
            id={id}
            value={value}
            onChange={handleSelectChange}
            options={options}
            components={animatedComponents}
            styles={selectCustomStyles}
            isDisabled={isDisabled}
            placeholder={placeholder}
            menuPortalTarget={document.body}
            menuPosition="fixed"
        />
    );
};