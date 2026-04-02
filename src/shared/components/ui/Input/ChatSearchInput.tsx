import React, { InputHTMLAttributes} from 'react';
// @ts-ignore
import styles from './ChatSearchInput.module.scss';

interface ChatSearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
    searchTerm: string;
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    placeholder: string;
    disabled?: boolean;
    className?: string;
}

const ChatSearchInput = React.memo(
    React.forwardRef<HTMLInputElement, ChatSearchInputProps>(({
                                                                  searchTerm,
                                                                  onSearchChange,
                                                                  onKeyDown,
                                                                  placeholder,
                                                                  disabled = false,
                                                                  className,
                                                                  ...rest
                                                              }, ref) => {
        return (
            <input
                ref={ref} // 🔥 ПЕРЕДАЕМ REF НА ЭЛЕМЕНТ
                type="text"
                placeholder={placeholder}
                value={searchTerm}
                onChange={onSearchChange}
                onKeyDown={onKeyDown}
                disabled={disabled}
                className={className ? `${styles.input} ${className}` : styles.input}
                {...rest}
            />
        );
    })
);

export default ChatSearchInput;