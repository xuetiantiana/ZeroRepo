export interface GenerateOutlineRequest {
    sess: string, //定位用户标识
    topic: string,
    goal: string,
    key_msgs: string
}

export interface QueryOutlineRequest {
    sess: string,
    outline_id: number
}
export interface EditOutlineRequest {
    sess: string,
    content: string
}
export interface ConfirmOutlineRequest {
    sess: string,
    outline_id: number
}
export interface QueryStoryboardRequest {
    sess: string,
    workflow_id: number
}
export interface QueryImageRequest {
    sess: string,
    img_id: string
}
export interface ModifySectionRequest {
    sess: string,
    workflow_id: number,
    seg_id: number,
    img_id: string,
    text: string //该section的新文本
}
export interface ChatSendRequest {
    sess: string,
    input: string
}
export interface ChatQueryRequest {
    sess: string,
}
export interface QuoteSelectRequest {
    sess: string,
    type: number, //0:图片 1:文本
    info: number,
    target: string,
    input: string
}
export interface QuoteQueryRequest {
    sess: string,
}