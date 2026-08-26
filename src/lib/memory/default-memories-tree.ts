type TreeNode = {
    name: string
    type: "directory" | "file"
    description?: string
    content?: string
    children?: TreeNode[]
}

function mdFile(name: string, slug: string, description: string, body: string[] = []): TreeNode {
    return {
        name,
        type: "file",
        content: [
            "---",
            `name: ${slug}`,
            `description: ${description}`,
            "sources: []",
            "aliases: []",
            "---",
            "",
            ...body,
        ].join("\n"),
    }
}

const generateDefaultMemoryTree = ({ user, instructions }: { user: string; instructions: string[] }): TreeNode => {
    return {
        name: "Assistant memory",
        type: "directory",
        children: [
            mdFile("_meta", "meta", "Entry point of the assistant's persistent memory — read first", [
                "You are reading the entry point of the assistant's persistent memory. Read this file first, before browsing or creating anything else here.",
                "",
                "Every folder has its own _meta.md with instructions specific to that folder — read a folder's _meta.md before creating or editing files inside it.",
                "",
                "Structure:",
                `- you/preferences.md — how ${user} likes the assistant to work. Fixed file, does not gain siblings.`,
                `- you/profile.md — who ${user} is: role, goals, responsibilities. Fixed file, does not gain siblings.`,
                "- topics/ — subject-matter notes the assistant has built up (summary + key takeaways per topic). One file per topic, created the first time it comes up in depth.",
                `- areas/ — ongoing responsibilities or domains ${user} maintains (career, a project area, personal infrastructure). One file per area, listing active projects and standing responsibilities.`,
                `- people/ — people ${user} works or interacts with, and how to work with them. One file per person, created when they're first mentioned with enough detail to be useful later.`,
                "- sessions/ — reference pointers to past sessions only (id, date, summary, links to referenced topics/people). Never the full session transcript.",
                "",
                "How to use the tools:",
                ...instructions,
            ]),
            {
                name: "You",
                type: "directory",
                children: [
                    mdFile("_meta", "you-meta", "How the you/ folder is organized", [
                        `Facts about ${user}, split into two fixed files: preferences.md and profile.md. These two do not gain siblings — do not create other files in this folder.`,
                        "",
                        `- preferences.md — how ${user} likes the assistant to work.`,
                        `- profile.md — who ${user} is: role, goals, responsibilities.`,
                    ]),
                    mdFile("preferences", "you-preferences", `How ${user} likes the assistant to work`),
                    mdFile("profile", "you-profile", `Who ${user} is: role, goals, responsibilities`),
                ],
            },
            {
                name: "Topics",
                type: "directory",
                children: [
                    mdFile("_meta", "topics-meta", "How the topics/ folder is organized", [
                        "Subject-matter notes the assistant has built up: a summary plus key takeaways per topic.",
                        "",
                        "One file per topic, created the first time the topic comes up in depth — not for every passing mention.",
                    ]),
                ],
            },
            {
                name: "Areas",
                type: "directory",
                children: [
                    mdFile("_meta", "areas-meta", "How the areas/ folder is organized", [
                        `Ongoing responsibilities or domains ${user} maintains — a career, a project area, personal infrastructure.`,
                        "",
                        "One file per area, listing active projects and standing responsibilities. Update the area's file as work evolves rather than creating a new file for the same area.",
                    ]),
                ],
            },
            {
                name: "People",
                type: "directory",
                children: [
                    mdFile("_meta", "people-meta", "How the people/ folder is organized", [
                        `People ${user} works or interacts with, and how to work with them.`,
                        "",
                        "One file per person, created the first time they're mentioned with enough detail to be useful later — not for a passing name-drop.",
                    ]),
                ],
            },
            {
                name: "Sessions",
                type: "directory",
                children: [
                    mdFile("_meta", "sessions-meta", "How the sessions/ folder is organized", [
                        "Reference pointers to past sessions only: id, date, a short summary, and links to the topics/areas/people files it touched.",
                        "",
                        "Never store the full session transcript here — this folder is an index, not an archive.",
                        "One file per session.",
                    ]),
                ],
            },
        ],
    }
}
