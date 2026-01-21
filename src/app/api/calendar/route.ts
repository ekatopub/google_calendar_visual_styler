import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import type { SessionWithAccessToken } from "../auth/[...nextauth]/route";
import { google } from "googleapis";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const start = searchParams.get("start");
	const end = searchParams.get("end");
	const session = await getServerSession(authOptions);
	const accessToken = (session as SessionWithAccessToken).accessToken;
	if (!session || !accessToken) {
		return new Response(
			JSON.stringify({ error: "Unauthorized", session, accessToken }),
			{
				status: 401,
			}
		);
	}
	const oauth2Client = new google.auth.OAuth2();
	oauth2Client.setCredentials({ access_token: accessToken });
	const calendar = google.calendar({ version: "v3", auth: oauth2Client });
	try {
		const events = await calendar.events.list({
			calendarId: "primary",
			timeMin: start || new Date().toISOString(),
			timeMax: end || undefined,
			maxResults: 80,
			singleEvents: true,
			orderBy: "startTime",
		});

		// 生データ（展開済み）をサーバーログに出力
		console.log(
			"Google Calendar API response (data):\n" +
				JSON.stringify(events.data, null, 2)
		);

		return new Response(JSON.stringify(events.data.items), { status: 200 });
	} catch (e) {
		let errorMessage = "Failed to fetch events";
		if (e instanceof Error) {
			errorMessage = e.message;
		}
		// エラー詳細をサーバーログに出力
		console.error("[Google Calendar API ERROR]", e);
		return new Response(
			JSON.stringify({ error: errorMessage, details: String(e) }),
			{
				status: 500,
			}
		);
	}
}
