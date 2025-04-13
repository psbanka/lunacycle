export const fetchRandomAvatar = async (email: string): Promise<string> => {
  // const encodedEmail = encodeURIComponent(email);
  const avatarUrl = `https://avatar.iran.liara.run/public`;

  console.log('>>', avatarUrl);
  try {
    const response = await fetch(avatarUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch avatar: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // Optionally detect MIME type or hardcode if always the same
    const contentType = response.headers.get("content-type") || "image/png";
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error("Error fetching random avatar:", error);
    throw error;
  }
};