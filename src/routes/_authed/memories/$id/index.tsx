import {
	RiArrowLeftLine,
	RiArrowRightLine,
	RiCloseLine,
	RiCollapseDiagonalLine,
	RiDeleteBinLine,
	RiExpandDiagonalLine,
	RiFileTextLine,
	RiListCheck2,
	RiPencilLine,
	RiPriceTag3Line,
} from "@remixicon/react";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { TagsInput } from "#/components/ui/tag-input";
import { Textarea } from "#/components/ui/textarea";
import { useWorkspace } from "#/components/workspace";
import { useHistoryNavigation } from "#/hooks/use-history-navigation";
import { formatBytes, formatRelativeTime } from "#/lib/formatter";
import type { CategoryId } from "#/lib/memory/category";
import { CATEGORY_ICONS, CATEGORY_LABELS } from "#/lib/memory/category";
import { parseMarkdown, stringifyMarkdown } from "#/lib/memory/markdown";
import {
	creatableCategoryIdEnum,
	deleteMemoryFn,
	getMemoryByIdFn,
	updateMemoryFn,
} from "#/lib/server/memories.function";
import { cn } from "#/lib/utils";

type CreatableCategoryId = (typeof creatableCategoryIdEnum)[number];

type PropertyRowProps = {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	required?: boolean;
	children: React.ReactNode;
};

function PropertyRow({ icon: Icon, label, required, children }: PropertyRowProps) {
	return (
		<div className="group flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted/50">
			<div className="flex w-32 shrink-0 items-center gap-2 text-sm text-muted-foreground">
				<Icon className="size-4" />
				{label}
				{required && <span className="text-destructive">*</span>}
			</div>
			<div className="flex-1">{children}</div>
		</div>
	);
}

function HistoryButtons() {
	const { canGoBack, canGoForward, goBack, goForward } = useHistoryNavigation();

	return (
		<div className="flex items-center gap-1">
			<Button variant="ghost" size="icon-sm" disabled={!canGoBack} onClick={goBack}>
				<RiArrowLeftLine />
				<span className="sr-only">Back</span>
			</Button>
			<Button variant="ghost" size="icon-sm" disabled={!canGoForward} onClick={goForward}>
				<RiArrowRightLine />
				<span className="sr-only">Forward</span>
			</Button>
		</div>
	);
}

const ghostInputClassName =
	"h-7 flex-1 rounded-md border-none bg-transparent px-1.5 shadow-none focus-visible:bg-background focus-visible:ring-1";
const ghostTagsInputClassName =
	"min-h-7 rounded-md border-none bg-transparent px-1.5 py-0.5 shadow-none has-[input:focus-visible]:bg-background has-[input:focus-visible]:ring-1";

const memoryQueryOptions = (id: string) =>
	queryOptions({
		queryKey: ["memory", id],
		queryFn: () => getMemoryByIdFn({ data: { id } }),
	});

export const Route = createFileRoute("/_authed/memories/$id/")({
	validateSearch: z.object({
		edit: z.boolean().optional(),
	}),
	remountDeps: ({ params }) => params.id,
	loader: async ({ context, params }) => {
		const memory = await context.queryClient.query(memoryQueryOptions(params.id));
		if (!memory) throw notFound();
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { id } = Route.useParams();
	const { edit } = Route.useSearch();
	const { data: memory } = useSuspenseQuery(memoryQueryOptions(id));
	const navigate = useNavigate({ from: Route.fullPath });
	const queryClient = useQueryClient();
	const { isMobile, isMaximized, toggleMaximized, setMainOpen } = useWorkspace();

	const [categoryId, setCategoryId] = useState<CreatableCategoryId>(
		(memory?.categoryId as CreatableCategoryId | undefined) ?? creatableCategoryIdEnum[0],
	);
	const [name, setName] = useState(memory?.name ?? "");
	const [description, setDescription] = useState(memory?.description ?? "");
	const [sources, setSources] = useState<string[]>(memory ? parseMarkdown(memory.content).frontmatter.sources : []);
	const [aliases, setAliases] = useState<string[]>(memory ? parseMarkdown(memory.content).frontmatter.aliases : []);
	const [content, setContent] = useState(memory ? parseMarkdown(memory.content).content : "");

	const { mutate: deleteMemory, isPending: isDeleting } = useMutation({
		mutationFn: deleteMemoryFn,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["memories"] });
			void navigate({ to: "/memories" });
		},
	});

	const {
		mutate: saveMemory,
		isPending: isSaving,
		error: saveError,
	} = useMutation({
		mutationFn: updateMemoryFn,
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["memories"] }),
				queryClient.invalidateQueries({ queryKey: ["memory", id] }),
			]);
			void navigate({ search: (prev) => ({ ...prev, edit: undefined }) });
		},
	});

	if (!memory) return null;

	const isEditing = edit === true;
	const CategoryIcon = CATEGORY_ICONS[memory.categoryId];

	const startEdit = () => {
		const parsed = parseMarkdown(memory.content);
		setCategoryId(memory.categoryId as CreatableCategoryId);
		setName(parsed.frontmatter.name);
		setDescription(parsed.frontmatter.description);
		setSources(parsed.frontmatter.sources);
		setAliases(parsed.frontmatter.aliases);
		setContent(parsed.content);
		void navigate({ search: (prev) => ({ ...prev, edit: true }) });
	};

	const cancelEdit = () => {
		void navigate({ search: (prev) => ({ ...prev, edit: undefined }) });
	};

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		saveMemory({
			data: {
				id,
				categoryId,
				content: stringifyMarkdown({
					frontmatter: { name, description, sources, aliases },
					content,
				}),
			},
		});
	};

	return (
		<>
			{isMobile ? (
				<div className="sticky top-0 right-0 pt-1.5 px-2 flex justify-between bg-popover">
					<div className="flex items-center gap-1">
						<Button variant="ghost" size="icon-sm" onClick={() => setMainOpen(false)}>
							<RiCloseLine />
							<span className="sr-only">Close</span>
						</Button>
						<HistoryButtons />
					</div>
					<div>{name}</div>
					<div>
						<Button variant="ghost" size="icon-sm" onClick={toggleMaximized}>
							{isMaximized ? <RiCollapseDiagonalLine /> : <RiExpandDiagonalLine />}
							<span className="sr-only">{isMaximized ? "Minimize" : "Maximize"}</span>
						</Button>
					</div>
				</div>
			) : (
				<div className="sticky top-0 right-0 pt-1.5 px-2 flex justify-between bg-popover">
					<HistoryButtons />
					<div>{name}</div>
					<div></div>
				</div>
			)}
			<div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 md:p-8 overflow-auto">
				<form
					onSubmit={handleSubmit}
					className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xs"
				>
					<div className="flex items-start justify-between gap-4">
						<div className="flex items-center gap-3">
							<span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
								<CategoryIcon className="size-5 text-foreground/70" />
							</span>
							<div className="flex flex-col gap-0.5">
								<h1 className="font-heading text-lg font-medium">{memory.name}</h1>
								<span className="font-mono text-xs text-muted-foreground">{memory.path}</span>
							</div>
						</div>
						<div className="flex shrink-0 items-center gap-2">
							{memory.kind === "toc" ? (
								<Badge variant="secondary" data-icon="inline-start">
									<RiListCheck2 />
									TOC
								</Badge>
							) : (
								<Badge variant="outline" data-icon="inline-start">
									<RiFileTextLine />
									Entry
								</Badge>
							)}
						</div>
					</div>
					<div className="flex items-center gap-3 border-y border-border py-3 text-xs text-muted-foreground">
						<span className="flex items-center gap-1">
							<span
								className={cn("size-1.5 rounded-full", memory.embedding ? "bg-emerald-500" : "bg-muted-foreground/40")}
							/>
							{memory.embedding ? "Embedded" : "Not embedded"}
						</span>
						<span>&middot;</span>
						<span>{formatBytes(memory.sizeBytes)}</span>
						<span>&middot;</span>
						<span>Updated {formatRelativeTime(memory.updatedAt)}</span>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="category">Category</Label>
						<Select
							value={categoryId}
							onValueChange={(value) => setCategoryId(value as CreatableCategoryId)}
							disabled={!isEditing}
						>
							<SelectTrigger id="category" className="w-fit">
								<SelectValue>{(value: CategoryId) => CATEGORY_LABELS[value]}</SelectValue>
							</SelectTrigger>
							<SelectContent>
								{creatableCategoryIdEnum.map((value) => (
									<SelectItem key={value} value={value}>
										{CATEGORY_LABELS[value]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex flex-col gap-0.5 rounded-2xl border border-border bg-card p-3">
						<div className="mb-1 text-sm font-medium">Properties</div>
						<PropertyRow icon={RiFileTextLine} label="Name" required>
							<Input
								value={name}
								placeholder="Empty"
								required
								readOnly={!isEditing}
								onChange={(event) => setName(event.target.value)}
								className={ghostInputClassName}
							/>
						</PropertyRow>
						<PropertyRow icon={RiFileTextLine} label="Description">
							<Input
								value={description}
								placeholder="Empty"
								readOnly={!isEditing}
								onChange={(event) => setDescription(event.target.value)}
								className={ghostInputClassName}
							/>
						</PropertyRow>
						<PropertyRow icon={RiListCheck2} label="Sources">
							<TagsInput
								value={sources}
								onValueChange={setSources}
								disabled={!isEditing}
								className={ghostTagsInputClassName}
								placeholder="Empty"
							/>
						</PropertyRow>
						<PropertyRow icon={RiPriceTag3Line} label="Aliases">
							<TagsInput
								value={aliases}
								onValueChange={setAliases}
								disabled={!isEditing}
								className={ghostTagsInputClassName}
								placeholder="Empty"
							/>
						</PropertyRow>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="content">Content</Label>
						<Textarea
							id="content"
							className="min-h-40"
							value={content}
							readOnly={!isEditing}
							onChange={(event) => setContent(event.target.value)}
						/>
					</div>
					{saveError && <p className="text-sm text-destructive">{saveError.message}</p>}
					<div className="flex justify-end gap-2">
						{isEditing ? (
							<>
								<Button type="button" variant="outline" onClick={cancelEdit} disabled={isSaving}>
									Cancel
								</Button>
								<Button type="submit" disabled={isSaving}>
									{isSaving ? "Saving..." : "Save"}
								</Button>
							</>
						) : (
							<>
								<Button type="button" variant="outline" data-icon="inline-start" onClick={startEdit}>
									<RiPencilLine />
									Edit
								</Button>
								<Button
									type="button"
									variant="destructive"
									data-icon="inline-start"
									disabled={isDeleting}
									onClick={() => deleteMemory({ data: { id: memory.id } })}
								>
									<RiDeleteBinLine />
									{isDeleting ? "Deleting..." : "Delete"}
								</Button>
							</>
						)}
					</div>
				</form>
			</div>
		</>
	);
}
