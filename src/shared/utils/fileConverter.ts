export interface FileToSend {
    fileName: string;
    contentType: string;
    bytes: string;
}

export interface FileToUploadPayload extends FileToSend {
    dataUrl: string;
}

export const fileToBytes = (file: File): Promise<FileToUploadPayload> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const dataUrl = event.target?.result;

            if (typeof dataUrl === "string") {
                const parts = dataUrl.split(',');
                const base64 = parts[1];

                resolve({
                    fileName: file.name,
                    contentType: file.type,
                    bytes: base64,
                    dataUrl: dataUrl,
                });
            } else {
                reject(new Error("Failed to read file as DataURL."));
            }
        };

        reader.onerror = (error) => reject(error);

        reader.readAsDataURL(file);
    });
};