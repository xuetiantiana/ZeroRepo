/*
 * @description: 请求接口 配置
 * @Author: Jay
 * @Date: 2022-06-08 10:41:36
 * @LastEditors: Jay
 * @LastEditTime: 2022-06-08 14:29:38
 */
//导入 Axios 请求
import { createAxios } from './axios'
import type { GenerateOutlineRequest } from '../interface/metaphor'


//其他配置
const request = createAxios({
    baseURL: 'https://metaphor-epa3d5e0g6ercrev.eastus2-01.azurewebsites.net/',
});


export const getSources = (data: any): any => {
    console.log("传入的数据",data)
    return request.post("/api/get-sources/", data)  
    const result = {
        "source": [
            {
                "name": "Candle Holder",
                "description": "A classic candle holder with elongated arms and ornate detailing.",
                "details": "The candle holder's arms mimic the tiers of a dessert stand, while its central stem provides structural stability. Its association with light and warmth evokes a cozy reading room ambiance, symbolizing illumination and inspiration during study or leisure.",
                "source_img_url": "https://images.pexels.com/photos/31532727/pexels-photo-31532727.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=280",
                "source_type": "Reflective"
            },
            {
                "name": "Fountain",
                "description": "A tiered fountain with cascading water flowing across each level.",
                "details": "The fountain's tiers mirror the structure of a dessert stand, and the flowing water reflects the fluidity of sharing desserts. It symbolizes refreshment and tranquility, aligning with the serene environment of a reading room for teenagers.",
                "source_img_url": "https://images.pexels.com/photos/719396/pexels-photo-719396.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=280",
                "source_type": "Behavioral"
            },
            {
                "name": "Shell",
                "description": "A spiral shell with layered ridges and smooth textures.",
                "details": "The shell's layered form resembles the arrangement of desserts on a stand, while its natural curves evoke calmness. It symbolizes discovery and curiosity, resonating with teenagers who are exploring knowledge in a reading room.",
                "source_img_url": "https://images.pexels.com/photos/33234/nautilus-shell-shimmer-silver.jpg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=280",
                "source_type": "Visceral"
            },
            {
                "name": "Chessboard",
                "description": "A multi-tiered chessboard with a grid pattern and contrasting colors.",
                "details": "The chessboard's layered structure mirrors the tiers of a dessert stand, and its grid pattern provides visual intrigue. It symbolizes strategy and intellectual engagement, perfect for a reading room setting where teenagers are building mental skills.",
                "source_img_url": "https://images.pexels.com/photos/260024/pexels-photo-260024.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=280",
                "source_type": "Reflective"
            },
            {
                "name": "Lantern",
                "description": "A hanging lantern with a tiered frame and glowing interior.",
                "details": "The lantern's tiered frame echoes the structure of a dessert stand, while its soft light creates a warm atmosphere. It symbolizes guidance and exploration, enhancing the reading experience for teenagers in the room.",
                "source_img_url": "https://images.pexels.com/photos/2233416/pexels-photo-2233416.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=280",
                "source_type": "Visceral"
            }
        ],
        "target_img_url": "https://m.media-amazon.com/images/I/71eossMQi8L._AC_SX679_.jpg"
    }


    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve(result);
        }, 1000);
    });
}


export const getAttributes = (data: any): any => {
    console.log("传入的数据",data)
    return request.post("/api/get-attributes/", data)

    const result = {
        "target_attributes": [
            {
                "content": "Three-tiered circular design, gold accents",
                "attribute_type": "Vision"
            },
            {
                "content": "Supports desserts, organizes presentation",
                "attribute_type": "Usage"
            },
            {
                "content": "Smooth ceramic plates, sturdy stem",
                "attribute_type": "Touch"
            },
            {
                "content": "Soft clinking when tiers touch",
                "attribute_type": "Sound"
            },
            {
                "content": "Neutral scent, clean material",
                "attribute_type": "Smell"
            },
            {
                "content": "Enhances visual enjoyment of treats",
                "attribute_type": "Taste"
            },
            {
                "content": "Elegant handle for carrying",
                "attribute_type": "Usage"
            },
            {
                "content": "Light and shadow interplay on tiers",
                "attribute_type": "Vision"
            },
            {
                "content": "Sturdy base ensures balance",
                "attribute_type": "Touch"
            }
        ],
        "source_attributes": [
            {
                "content": "Single central stem, metallic shine",
                "attribute_type": "Vision"
            },
            {
                "content": "Holds candle, provides ambient lighting",
                "attribute_type": "Usage"
            },
            {
                "content": "Metallic finish, cool to touch",
                "attribute_type": "Touch"
            },
            {
                "content": "Gentle crackling sound of flame",
                "attribute_type": "Sound"
            },
            {
                "content": "Warm wax scent when lit",
                "attribute_type": "Smell"
            },
            {
                "content": "Symbolizes cozy warmth and relaxation",
                "attribute_type": "Taste"
            },
            {
                "content": "Slim arm mimics tiered structure",
                "attribute_type": "Vision"
            },
            {
                "content": "Base ensures stability during use",
                "attribute_type": "Touch"
            },
            {
                "content": "Illuminates surroundings for reading or leisure",
                "attribute_type": "Usage"
            }
        ],
        "mapping": [
            {
                "target_attribute": "Three-tiered circular design, gold accents",
                "target_type": "Vision",
                "source_attribute": "Slim arm mimics tiered structure",
                "source_type": "Vision",
                "description": "The candle holder's slim arms echo the tiered elegance of the dessert stand, enhanced by metallic shine."
            },
            {
                "target_attribute": "Smooth ceramic plates, sturdy stem",
                "target_type": "Touch",
                "source_attribute": "Metallic finish, cool to touch",
                "source_type": "Touch",
                "description": "The dessert stand’s smooth ceramic plates parallel the candle holder's cool metallic surface, evoking stability and refinement."
            }
        ]
    }
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve(result);
        }, 1000);
    });
}

export const getConstraint = (data: any): any => {
    console.log("传入的数据",data)
    return request.post("/api/get-constraint/", data)

    const result = {
        "constraint": [
            {
                "content": "Maximum height 50 cm",
                "constraint_type": "Structure"
            },
            {
                "content": "Base made of metal",
                "constraint_type": "Structure"
            },
            {
                "content": "Light source adjustable brightness",
                "constraint_type": "Function"
            },
            {
                "content": "Diffuser softens light output",
                "constraint_type": "Function"
            },
            {
                "content": "Rotational dimming mechanism",
                "constraint_type": "Behavior"
            },
            {
                "content": "Top part resembles balloon",
                "constraint_type": "Structure"
            },
            {
                "content": "Supports warm white bulbs",
                "constraint_type": "Function"
            },
            {
                "content": "Cord retracts for portability",
                "constraint_type": "Behavior"
            },
            {
                "content": "Flexible neck for adjustment",
                "constraint_type": "Structure"
            },
            {
                "content": "Base stores small items",
                "constraint_type": "Function"
            },
            {
                "content": "Shade rotates 360 degrees",
                "constraint_type": "Behavior"
            }
        ],
        "properties": [
            {
                "content": "Fabric mimics balloon texture",
                "properties_type": "Material"
            },
            {
                "content": "Blown glass for balloon shape",
                "properties_type": "Manufacture"
            },
            {
                "content": "Gradient hues for shade",
                "properties_type": "Graphic & Color"
            },
            {
                "content": "Metallic stripes for basket",
                "properties_type": "Graphic & Color"
            },
            {
                "content": "Layered paper for diffuser",
                "properties_type": "Material"
            },
            {
                "content": "Inflatable material for shade",
                "properties_type": "Material"
            },
            {
                "content": "Wicker-like texture on base",
                "properties_type": "Manufacture"
            },
            {
                "content": "Collapsible balloon-inspired shade",
                "properties_type": "Structure"
            },
            {
                "content": "Warm light mimics sunset glow",
                "properties_type": "Sensory"
            },
            {
                "content": "Suspended design for airiness",
                "properties_type": "Structure"
            },
            {
                "content": "Bright colors like balloons",
                "properties_type": "Graphic & Color"
            }
        ]
    }
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve(result);
        }, 1000);
    });
}

export const generateResults = (data: any): any => {
    return request.post("/api/generate-results/", data)
    console.log("传入的数据",data)
    const result = [
        {
            "name": "Balloon Glow Lamp",
            "slogan": "Lift your evenings with a warm, diffused glow.",
            "descriptions": "The Balloon Glow Lamp evokes the magic of hot air balloons floating in the sky during golden hour. Designed for living rooms frequented by travelers, its blown glass balloon-shaped shade softly diffuses light, creating a warm glow reminiscent of a sunset. The metal base features a wicker-like texture, resembling the basket of a balloon, adding a tactile connection to the metaphor. The lamp is compact, standing at a maximum height of 50 cm, making it ideal for smaller spaces or portable use. Its gradient hues transition from deep amber to soft orange, visually capturing the warmth of a balloon burner. This poetic design transforms the mundane act of lighting a room into an emotional journey, evoking feelings of wonder, nostalgia, and discovery.",
            "imageprompt": "A compact lamp with a blown glass balloon-shaped shade, gradient hues transitioning from amber to orange, resembling a hot air balloon. The metallic base features a wicker-like texture, and the light softly diffuses like sunset rays. The style is elegant and poetic, with a focus on warmth and wonder.",
            "constriant_and_propertie": {
                "constraints": [
                    "Maximum height 50 cm",
                    "Top part resembles balloon",
                    "Diffuser softens light output",
                    "Base made of metal"
                ],
                "properties": [
                    "Blown glass for balloon shape",
                    "Gradient hues for shade",
                    "Wicker-like texture on base",
                    "Warm light mimics sunset glow"
                ],
                "styles": [
                    "elegant",
                    "poetic"
                ]
            }
        },
        {
            "name": "Playful Orbit Lamp",
            "slogan": "Rotate your imagination with Memphis-style brightness.",
            "descriptions": "The Playful Orbit Lamp brings the whimsical charm of colorful balloons into the living room. Its shade rotates 360 degrees, allowing users to direct light as needed, while the rotational dimming mechanism mimics the playful twist of inflating a balloon. The shade, made of fabric with a balloon-like texture, is vibrant in color, evoking a carnival atmosphere. Metallic stripes adorn the base, resembling the basket of a hot air balloon, while layered paper serves as a diffuser, softening the output. The retractable cord ensures portability, making it a perfect companion for travelers. The Memphis-style aesthetic transforms the product into a playful centerpiece, sparking joy, curiosity, and interaction.",
            "imageprompt": "A Memphis-style lamp with a rotating balloon-shaped fabric shade in bright, playful colors. Metallic stripes on the base resemble a balloon basket, while layered paper diffuses the light. The lamp features a retractable cord for portability and a rotational dimming mechanism for interactive fun.",
            "constriant_and_propertie": {
                "constraints": [
                    "Rotational dimming mechanism",
                    "Shade rotates 360 degrees",
                    "Cord retracts for portability",
                    "Flexible neck for adjustment"
                ],
                "properties": [
                    "Bright colors like balloons",
                    "Fabric mimics balloon texture",
                    "Metallic stripes for basket",
                    "Layered paper for diffuser"
                ],
                "styles": [
                    "playful",
                    "Memphis-style"
                ]
            }
        },
        {
            "name": "Airy Haven Lamp",
            "slogan": "Minimalist elegance with a touch of flight.",
            "descriptions": "The Airy Haven Lamp is a suspended lighting solution that captures the serene feeling of floating in the sky. Its inflatable material shade gives it a lightweight, airy presence, while gradient hues mimic the changing colors of the horizon during flight. The metallic stripes on the base evoke the structural elements of a balloon basket. With adjustable brightness and support for warm white bulbs, it allows travelers to tailor their ambiance, creating a cozy yet modern aesthetic. The lamp’s minimalist design transforms the concept of lighting into an emotional metaphor for freedom, exploration, and tranquility, making it ideal for travelers seeking a grounding yet inspiring piece.",
            "imageprompt": "A modern, minimalist lamp with a suspended inflatable balloon-shaped shade featuring gradient hues from blue to pink. Metallic stripes on the base resemble balloon basket detailing. The lamp emits adjustable warm white light, creating an airy and tranquil atmosphere.",
            "constriant_and_propertie": {
                "constraints": [
                    "Base stores small items",
                    "Light source adjustable brightness",
                    "Supports warm white bulbs",
                    "Top part resembles balloon"
                ],
                "properties": [
                    "Inflatable material for shade",
                    "Gradient hues for shade",
                    "Suspended design for airiness",
                    "Metallic stripes for basket"
                ],
                "styles": [
                    "modern",
                    "minimalist"
                ]
            }
        },
        {
            "name": "Collapsible Balloon Lamp",
            "slogan": "Humor meets portability in a lighthearted design.",
            "descriptions": "The Collapsible Balloon Lamp combines humor and practicality, designed for travelers who value both style and convenience. Its collapsible balloon-inspired shade is crafted from blown glass, allowing it to fold down for easy storage. Bright colors mimic the playful nature of real balloons, while layered paper diffuses the light for soft illumination. The lamp features a cord that retracts, ensuring portability, and its shade rotates 360 degrees, providing versatile lighting options. The metallic base adds a touch of elegance, while the overall design injects humor into the living space, making it a conversation starter. This Alessi-style lamp transforms lighting into a joyful and dynamic experience, evoking laughter and curiosity.",
            "imageprompt": "An Alessi-style lamp with a collapsible blown glass balloon-shaped shade in bright colors. Layered paper diffuses the light softly. The metallic base complements the humorous design, while the retractable cord and 360-degree rotation enhance portability and interactivity.",
            "constriant_and_propertie": {
                "constraints": [
                    "Cord retracts for portability",
                    "Shade rotates 360 degrees",
                    "Rotational dimming mechanism",
                    "Base made of metal"
                ],
                "properties": [
                    "Collapsible balloon-inspired shade",
                    "Layered paper for diffuser",
                    "Blown glass for balloon shape",
                    "Bright colors like balloons"
                ],
                "styles": [
                    "humorous",
                    "Alessi-style"
                ]
            }
        }
    ]
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve(result);
        }, 500);
    });
}


export const User_refine_result = (data: any): any => {
    return request.post("/api/user_refine_result/", data)
    console.log("传入的数据",data)
    const result = [
        {
            "name": "Cascade Dessert Stand",
            "slogan": "A flowing tiered stand for your dessert display.",
            "descriptions": "Using scenario: Ideal for hosting parties, the Cascade Dessert Stand elegantly showcases cakes, cupcakes, and finger desserts, creating a centerpiece that brings movement and charm to the table.\nMetaphor expression: Inspired by the graceful arcs of a fountain, the circular plates are tiered in a cascading arrangement with soft curves. The stand emits a visual metaphor of flowing water through the smooth and reflective surfaces of polished stainless steel. Gentle splashing sound inspiration is incorporated through the subtle metallic resonance when pieces are placed on the stand.\nMeaning and Emotion: The design transforms the dessert stand into a celebration of fluidity and grace, evoking emotions of serenity and sophistication. It turns dessert presentation into an experience of dynamic elegance.",
            "imageprompt": "A polished stainless steel dessert stand inspired by a fountain, featuring circular plates arranged in cascading tiers with soft curves. The stand includes an ergonomic handle for easy transport, designed as an arched piece resembling a fountain's spout. Dishwasher-safe components are seamlessly integrated. The visual emphasizes fluidity with smooth, reflective surfaces and a dynamic arrangement of tiers. It should look modern and elegant, suitable for upscale dining.",
            "scheme":{
                "constraints": [
                    "Adjustable lamp arm",
                    "Compact base",
                    "Three-tiered plate arrangement"
                ],
                "properties": [
                    "Wooden base with textured finish",
                    "Leaf vein pattern on fabric",
                    "Vertical jet-like structure"
                ],
                "styles": [
                    "elegant"
                ]
            }
        },
        {
            "name": "Splash Dessert Tower",
            "slogan": "Playful tiers for joyful gatherings.",
            "descriptions": "Using scenario: Perfect for casual get-togethers or children's parties, the Splash Dessert Tower adds a playful touch to serving treats like cookies, brownies, and colorful candies.\nMetaphor expression: The design mimics the playful splashing of a fountain, with each circular plate shaped irregularly, as though ripples were frozen in time. Bright, glossy finishes evoke the shimmer of sunlight on water. The handle resembles a playful splash pattern, and soft silicone edges make it safe and tactile for children. The gentle splashing sound metaphor is echoed with the soft clinking sound when pieces interact.\nMeaning and Emotion: This design brings a sense of joy and liveliness to dessert serving, creating a fun and cheerful atmosphere. It invites interaction and adds an element of whimsy to the table.",
            "imageprompt": "A playful dessert stand with colorful, glossy finishes. Circular plates have irregular, ripple-like shapes inspired by splashing water, arranged in cascading tiers. The handle is shaped like a splash pattern, and the edges of the plates are lined with soft silicone for safety and tactile appeal. Dishwasher-safe parts are seamlessly incorporated into the design. The overall aesthetic is cheerful and vibrant, suitable for casual gatherings or children's parties.",
            "scheme":{
                "constraints": [
                    "Adjustable lamp arm",
                    "Compact base"
                ],
                "properties": [
                    "Wooden base with textured finish",
                    "Leaf vein pattern on fabric"
                ],
                "styles": [
                    "elegant"
                ]
            }
        },
        {
            "name": "Minimalist Flow Stand",
            "slogan": "A serene dessert display inspired by flowing water.",
            "descriptions": "Using scenario: Ideal for modern homes or minimalist spaces, the Minimalist Flow Stand offers a serene and functional way to present desserts, such as macarons, fruit tarts, and petite cakes.\nMetaphor expression: The design uses pure, matte ceramic plates arranged in precise cascading tiers to evoke the calm arcs of a flowing fountain. The handle is a sleek, linear element that aligns with the minimalist aesthetic while ensuring easy transport. The gentle splashing sound metaphor is translated into the visual stillness of the design, invoking quiet elegance. The smooth ceramic texture adds a tactile connection to the metaphor.\nMeaning and Emotion: This design transforms the dessert stand into a meditation on simplicity and flow, evoking emotions of tranquility and understated sophistication. It encourages mindfulness in both presentation and consumption.",
            "imageprompt": "A minimalist dessert stand with matte ceramic circular plates arranged in cascading tiers. The design is clean and precise, with a sleek linear handle for easy transport. The plates are smooth and tactile, with a soft matte texture that enhances the serene aesthetic. Dishwasher-safe components are integrated seamlessly. The overall look is modern, calm, and understated, suitable for minimalist spaces."
        },
        {
            "name": "Poetic Fountain Dessert Stand",
            "slogan": "A lyrical tiered stand for desserts that inspire.",
            "descriptions": "Using scenario: Perfect for artistic gatherings or intimate dinners, the Poetic Fountain Dessert Stand elevates desserts like chocolates, soufflés, and artisanal pastries into works of art.\nMetaphor expression: The design draws inspiration from the lyrical arcs of a fountain, with tiers shaped like flowing petals in brushed brass. The handle is sculpted like a fountain spout, adding a poetic touch. The layered arrangement conveys visual movement, while the brushed brass surface adds warmth and tactile richness. The gentle splashing sound metaphor is subtly integrated with the soft resonance of the metallic surface.\nMeaning and Emotion: This design transforms the dessert stand into a piece of functional art, evoking emotions of wonder and inspiration. It brings poetry and elegance to dessert presentation, turning it into a creative expression.",
            "imageprompt": "An artistic dessert stand made of brushed brass, with circular plates shaped like flowing petals arranged in cascading tiers. The handle is sculpted to resemble a fountain spout, adding a poetic element. The brushed brass finish provides warmth and tactile richness, and the layered arrangement conveys visual movement. Dishwasher-safe components are integrated without compromising the artistic aesthetic. The design is lyrical and elegant, suitable for artistic gatherings or intimate dinners."
        }
    ]
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve(result);
        }, 500);
    });
}

export const generatePic = (data: any): any => {
    return request.post("/api/generate-pic/", data)
    const result = {
        "image_url": "https://images.pexels.com/photos/112811/pexels-photo-112811.jpeg?auto=compress&cs=tinysrgb&dpr=crop&h=200&w=200"
    }
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve(result);
        }, 5000);
    });
}

export const pushMapping = (data: any): any => {
    console.log("传入的数据",data)
    return request.post("/api/push-mapping/", data)

    const result = {
        "target_attribute": "Circular plates with tiered arrangement.",
        "source_attribute": "Flowing water with dynamic movement.",
        "description": "The dessert stand features circular, transparent plates with gently curved edges that cascade slightly downward, mimicking the flow of water tiers in a fountain. This design evokes a sense of celebration and abundance, as desserts appear to flow gracefully like a dynamic stream, adding an elegant and lively centerpiece to gatherings."
    }
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve(result);
        }, 500);
    });
}



export const addOneSource = (data: any): any => {
    console.log("传入的数据",data)
    return request.post("/api/Get_Sources_from_user_select/", data)

    const result = {
        "name": "Candle Holder",
        "description": "A classic candle holder with elongated arms and ornate detailing.",
        "details": "The candle holder's arms mimic the tiers of a dessert stand, while its central stem provides structural stability. Its association with light and warmth evokes a cozy reading room ambiance, symbolizing illumination and inspiration during study or leisure.",
        "source_img_url": "https://images.pexels.com/photos/31532727/pexels-photo-31532727.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=280",
        "source_type": "Reflective"
    }
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve(result);
        }, 500);
    });
}

export const Get_environment_users = (data: any): any => {
    console.log("传入的数据",data)
    return request.post("/api/get_environment_users/", data)

    const result = {
        "Using Environment": ["Environment1", "Environment2", "Environment3"],
        "Target Users": ["UserGroup1", "UserGroup2", "UserGroup3"]
    }
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve(result);
        }, 500);
    });
}


export const selectConstriants = (data: any): any => {
    console.log("传入的数据",data)
    return request.post("/api/select_constriants/", data)

    const result = {
        "schemes": [
            {
                "constraints": [
                    "Maximum height 50 cm",
                    "Top part resembles balloon",
                    "Diffuser softens light output",
                    "Base made of metal"
                ],
                "properties": [
                    "Blown glass for balloon shape",
                    "Gradient hues for shade",
                    "Wicker-like texture on base",
                    "Warm light mimics sunset glow"
                ],
                "styles": [
                    "elegant",
                    "poetic"
                ]
            },
            {
                "constraints": [
                    "Rotational dimming mechanism",
                    "Shade rotates 360 degrees",
                    "Cord retracts for portability",
                    "Flexible neck for adjustment"
                ],
                "properties": [
                    "Bright colors like balloons",
                    "Fabric mimics balloon texture",
                    "Metallic stripes for basket",
                    "Layered paper for diffuser"
                ],
                "styles": [
                    "playful",
                    "Memphis-style"
                ]
            },
            {
                "constraints": [
                    "Base stores small items",
                    "Light source adjustable brightness",
                    "Supports warm white bulbs",
                    "Top part resembles balloon"
                ],
                "properties": [
                    "Inflatable material for shade",
                    "Gradient hues for shade",
                    "Suspended design for airiness",
                    "Metallic stripes for basket"
                ],
                "styles": [
                    "modern",
                    "minimalist"
                ]
            },
            {
                "constraints": [
                    "Cord retracts for portability",
                    "Shade rotates 360 degrees",
                    "Rotational dimming mechanism",
                    "Base made of metal"
                ],
                "properties": [
                    "Collapsible balloon-inspired shade",
                    "Layered paper for diffuser",
                    "Blown glass for balloon shape",
                    "Bright colors like balloons"
                ],
                "styles": [
                    "humorous",
                    "Alessi-style"
                ]
            }
        ]
    }

    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve(result);
        }, 500);
    });
}


export const SearchImages = (data: any): any => {
    console.log("传入的数据",data)
    return request.post("/api/search-images/", data)

    const result = {
        "image_urls": [
            "https://images.pexels.com/photos/112811/pexels-photo-112811.jpeg?auto=compress&cs=tinysrgb&dpr=crop&h=200&w=200",
            "https://images.pexels.com/photos/12204296/pexels-photo-12204296.jpeg?auto=compress&cs=tinysrgb&dpr=crop&h=200&w=200",
            "https://images.pexels.com/photos/12506515/pexels-photo-12506515.jpeg?auto=compress&cs=tinysrgb&dpr=crop&h=200&w=200",
            "https://images.pexels.com/photos/709767/pexels-photo-709767.png?auto=compress&cs=tinysrgb&dpr=crop&h=200&w=200",
            "https://images.pexels.com/photos/3104527/pexels-photo-3104527.jpeg?auto=compress&cs=tinysrgb&dpr=crop&h=200&w=200",
            "https://images.pexels.com/photos/379954/pexels-photo-379954.jpeg?auto=compress&cs=tinysrgb&dpr=crop&h=200&w=200",
            "https://images.pexels.com/photos/7315318/pexels-photo-7315318.jpeg?auto=compress&cs=tinysrgb&dpr=crop&h=200&w=200",
            "https://images.pexels.com/photos/8867242/pexels-photo-8867242.jpeg?auto=compress&cs=tinysrgb&dpr=crop&h=200&w=200",
            "https://images.pexels.com/photos/577511/pexels-photo-577511.jpeg?auto=compress&cs=tinysrgb&dpr=crop&h=200&w=200",
            "https://images.pexels.com/photos/3250031/pexels-photo-3250031.jpeg?auto=compress&cs=tinysrgb&dpr=crop&h=200&w=200",
            "https://images.pexels.com/photos/2911970/pexels-photo-2911970.jpeg?auto=compress&cs=tinysrgb&dpr=crop&h=200&w=200",
            "https://images.pexels.com/photos/577528/pexels-photo-577528.jpeg?auto=compress&cs=tinysrgb&dpr=crop&h=200&w=200",
            "https://images.pexels.com/photos/577518/pexels-photo-577518.jpeg?auto=compress&cs=tinysrgb&dpr=crop&h=200&w=200",
            "https://images.pexels.com/photos/27165068/pexels-photo-27165068.jpeg?auto=compress&cs=tinysrgb&dpr=crop&h=200&w=200",
            "https://images.pexels.com/photos/15352967/pexels-photo-15352967.jpeg?auto=compress&cs=tinysrgb&dpr=crop&h=200&w=200",
            "https://images.pexels.com/photos/20943579/pexels-photo-20943579.jpeg?auto=compress&cs=tinysrgb&dpr=crop&h=200&w=200",
            "https://images.pexels.com/photos/13986922/pexels-photo-13986922.jpeg?auto=compress&cs=tinysrgb&dpr=crop&h=200&w=200",
            "https://images.pexels.com/photos/29629443/pexels-photo-29629443.jpeg?auto=compress&cs=tinysrgb&dpr=crop&h=200&w=200",
            "https://images.pexels.com/photos/30440152/pexels-photo-30440152.jpeg?auto=compress&cs=tinysrgb&dpr=crop&h=200&w=200",
            "https://images.pexels.com/photos/27355156/pexels-photo-27355156.jpeg?auto=compress&cs=tinysrgb&dpr=crop&h=200&w=200"
        ]
    }

    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve(result);
        }, 500);
    });
}


