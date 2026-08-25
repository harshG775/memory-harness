import { authClient } from "./auth-client"

export type OAuthClientInfo = {
    client_id: string
    client_name?: string
    client_uri?: string
    logo_uri?: string
}

export async function fetchOAuthClientInfo(clientId: string): Promise<OAuthClientInfo | null> {
    const { data } = await authClient.oauth2.publicClientPrelogin({ client_id: clientId })
    return data
}
