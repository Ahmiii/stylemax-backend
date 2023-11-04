export type BlogContentData = {
    items: Array<BlogContentItem>

}
export type BlogContentItem =
    BlogContentItemText
    | BlogContentItemImage
    | BlogContentItemLink
    | BlogContentItemQuote
    | BlogContentItemCode
    | BlogContentItemTable
    | BlogContentItemParagraph
    | BlogContentItemHeader;
export type BlogContentItemText = {
    type: "text",
    data: {
        text: string
    }
}
export type BlogContentItemImage = {
    type: "image",
    data: {
        file: {
            url: string
        },
        caption: string,
        withBorder: boolean,
        withBackground: boolean,
        stretched: boolean,
    }

}
export type BlogContentItemLink = {
    type: "link",
    data: {
        link: string,
        meta: {
            title: string,
            description: string,
            image: {
                url: string
            }
        }
    }
}
export type BlogContentItemQuote = {
    type: "quote",
    data: {
        text: string,
        caption: string,
        alignment: "left" | "center" | "right"
    }
}
export type BlogContentItemCode = {
    type: "code",
    data: {
        code: string
    }
}
export type BlogContentItemTable = {
    type: "table",
    data: {
        content: string[][]
    }
}

export type BlogContentItemParagraph = {
    type: "paragraph",
    data: {
        text: string
    }
}

export type BlogContentItemHeader = {
    type: "header",
    data: {
        text: string,
        level: 1 | 2 | 3 | 4 | 5 | 6
    }
}
