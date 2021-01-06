
export interface HeadersInterface {
    key: string;
    value: string;
}

export class Headers {

    public headers:HeadersInterface[];

    constructor(headers?:HeadersInterface[]) {
        if(headers) {
            headers.forEach(el => {
                this.set(el.key, el.value)
            });
        }
    }

    set(key: string, value: any):void {
        this.headers = {...this.headers, [key]: value};
    }

    get(key: string): string {
        return this.headers[key];
    }

    getAll(): HeadersInterface[] {
        return this.headers;
    }
}