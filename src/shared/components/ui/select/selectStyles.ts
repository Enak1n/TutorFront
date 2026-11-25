import type { GroupBase, StylesConfig } from 'react-select';

/** Стили react-select на дизайн-токенах: автоматически подстраиваются под светлую/тёмную тему. */
export const themedSelectStyles = <Option, IsMulti extends boolean = false>(): StylesConfig<
    Option,
    IsMulti,
    GroupBase<Option>
> => ({
    menuPortal: base => ({ ...base, zIndex: 2000 }),
    menu: base => ({
        ...base,
        position: 'absolute',
        zIndex: 2000,
        marginTop: 6,
        overflow: 'hidden',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
    }),
    menuList: base => ({ ...base, padding: 6 }),
    control: (base, state) => ({
        ...base,
        minHeight: 44,
        borderRadius: 'var(--radius-sm)',
        backgroundColor: state.isDisabled ? 'var(--surface-2)' : 'var(--surface)',
        border: `1px solid ${state.isFocused ? 'var(--accent)' : 'var(--border)'}`,
        boxShadow: state.isFocused ? 'var(--focus-ring)' : 'none',
        transition: 'border-color 160ms, box-shadow 160ms',
        '&:hover': { borderColor: state.isFocused ? 'var(--accent)' : 'var(--border-strong)' },
    }),
    option: (base, state) => ({
        ...base,
        borderRadius: 'var(--radius-xs)',
        backgroundColor: state.isSelected
            ? 'var(--accent-soft)'
            : state.isFocused
              ? 'var(--surface-2)'
              : 'transparent',
        color: state.isSelected ? 'var(--accent)' : 'var(--text)',
        fontWeight: state.isSelected ? 600 : 500,
        cursor: 'pointer',
        padding: '10px 12px',
        ':active': { backgroundColor: 'var(--accent-soft)' },
    }),
    singleValue: base => ({ ...base, color: 'var(--text)' }),
    input: base => ({ ...base, color: 'var(--text)' }),
    placeholder: base => ({ ...base, color: 'var(--text-subtle)' }),
    multiValue: base => ({ ...base, backgroundColor: 'var(--accent-soft)', borderRadius: 'var(--radius-xs)' }),
    multiValueLabel: base => ({ ...base, color: 'var(--accent)' }),
    noOptionsMessage: base => ({ ...base, color: 'var(--text-subtle)' }),
    indicatorSeparator: base => ({ ...base, backgroundColor: 'var(--border)' }),
    dropdownIndicator: (base, state) => ({
        ...base,
        color: state.isFocused ? 'var(--accent)' : 'var(--text-subtle)',
        ':hover': { color: 'var(--accent)' },
    }),
    clearIndicator: base => ({ ...base, color: 'var(--text-subtle)', ':hover': { color: 'var(--danger)' } }),
});
