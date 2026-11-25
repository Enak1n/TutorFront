// Иконки в одном стиле (stroke, currentColor) — красятся через CSS и работают в обеих темах.
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const Icon = ({ size = 20, children, ...props }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth={2}
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
        {...props}
    >
        {children}
    </svg>
);

export const SendIcon = (props: IconProps) => (
    <Icon {...props}>
        <path d='M22 2 11 13' />
        <path d='M22 2 15 22l-4-9-9-4 20-7Z' />
    </Icon>
);

export const PaperclipIcon = (props: IconProps) => (
    <Icon {...props}>
        <path d='m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48' />
    </Icon>
);

export const CloseIcon = (props: IconProps) => (
    <Icon {...props}>
        <path d='M18 6 6 18M6 6l12 12' />
    </Icon>
);

export const FileIcon = (props: IconProps) => (
    <Icon {...props}>
        <path d='M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z' />
        <path d='M14 2v6h6' />
    </Icon>
);

export const ArrowLeftIcon = (props: IconProps) => (
    <Icon {...props}>
        <path d='M19 12H5M12 19l-7-7 7-7' />
    </Icon>
);

export const ArrowDownIcon = (props: IconProps) => (
    <Icon {...props}>
        <path d='M12 5v14M19 12l-7 7-7-7' />
    </Icon>
);

export const SearchIcon = (props: IconProps) => (
    <Icon {...props}>
        <circle cx='11' cy='11' r='7' />
        <path d='m20 20-3.5-3.5' />
    </Icon>
);

export const ChatBubbleIcon = (props: IconProps) => (
    <Icon {...props}>
        <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z' />
    </Icon>
);

export const CheckIcon = (props: IconProps) => (
    <Icon {...props}>
        <path d='M20 6 9 17l-5-5' />
    </Icon>
);

export const DoubleCheckIcon = (props: IconProps) => (
    <Icon {...props}>
        <path d='M18 6 7 17l-5-5' />
        <path d='m22 10-7.5 7.5L13 16' />
    </Icon>
);

export const UploadIcon = (props: IconProps) => (
    <Icon {...props}>
        <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12' />
    </Icon>
);
