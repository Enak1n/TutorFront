import { useContext } from 'react';
import { ChatContextType } from './chatTypes';
import { ChatContext } from './ChatContext';

export const useChat = (): ChatContextType => {
    const context = useContext(ChatContext);

    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }

    return context;
};