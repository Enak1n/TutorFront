import React from 'react';
import Select, { ActionMeta, SingleValue } from 'react-select';
import { themedSelectStyles } from './selectStyles';
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

const selectCustomStyles = themedSelectStyles<SelectOption>();

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