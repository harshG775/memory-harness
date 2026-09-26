import { RiExpandUpDownLine, RiLogoutBoxRLine, RiShieldKeyholeLine } from "@remixicon/react";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";

type UserMenuProps = {
	name: string;
	email: string;
	image?: string | null;
	onOpenConnections: () => void;
	onSignOut: () => void;
};

function getInitials(name: string) {
	const parts = name.trim().split(/\s+/);
	const initials = parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0]?.slice(0, 2);
	return (initials ?? "").toUpperCase();
}

/** Signed-in user row that opens an account menu upwards. */
export function UserMenu({ name, email, image, onOpenConnections, onSignOut }: UserMenuProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<button
						type="button"
						className="flex w-full items-center gap-2.5 rounded-md p-1.5 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50"
					>
						<Avatar>
							<AvatarImage src={image ?? undefined} alt="" />
							<AvatarFallback>{getInitials(name || email)}</AvatarFallback>
						</Avatar>
						<span className="min-w-0 flex-1 truncate text-sm font-medium">{name || email}</span>
						<RiExpandUpDownLine className="size-4 shrink-0 text-muted-foreground" />
					</button>
				}
			/>
			<DropdownMenuContent side="top" align="start" className="min-w-64">
				<DropdownMenuGroup>
					<DropdownMenuLabel>{email}</DropdownMenuLabel>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem data-icon="inline-start" onClick={onOpenConnections}>
					<RiShieldKeyholeLine />
					Connected apps
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem data-icon="inline-start" onClick={onSignOut}>
					<RiLogoutBoxRLine />
					Log out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
