import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Use the same project URL and anon/publishable key as assets/js/supabase-client.js.
const SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const authPanel = document.querySelector("#auth-panel");
const dashboard = document.querySelector("#dashboard");
const authMessage = document.querySelector("#auth-message");
const dashboardMessage = document.querySelector("#dashboard-message");
const listingRows = document.querySelector("#listings");

document.querySelector("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  authMessage.textContent = "Signing in…";
  const { error } = await supabase.auth.signInWithPassword({
    email: document.querySelector("#email").value.trim(),
    password: document.querySelector("#password").value
  });
  if (error) { authMessage.textContent = error.message; return; }
  await showDashboard();
});

document.querySelector("#signout").addEventListener("click", async () => {
  await supabase.auth.signOut();
  dashboard.hidden = true;
  authPanel.hidden = false;
  authMessage.textContent = "Signed out.";
});

async function showDashboard() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    authPanel.hidden = false;
    dashboard.hidden = true;
    return;
  }
  // SECURITY: UI gating is not authorization. RLS / trusted server-side authorization
  // must prevent non-admin users from changing listing status in the database.
  authPanel.hidden = true;
  dashboard.hidden = false;
  await loadListings();
}

async function loadListings() {
  dashboardMessage.textContent = "Loading listings…";
  listingRows.replaceChildren();
  const { data, error } = await supabase
    .from("listings")
    .select("id,title,category,price,currency,status,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    dashboardMessage.textContent = `Could not load listings: ${error.message}. Ensure admin access is enforced safely with RLS or an Edge Function.`;
    return;
  }
  dashboardMessage.textContent = `${data.length} listing(s) loaded.`;
  for (const listing of data) {
    const tr = document.createElement("tr");
    const values = [
      listing.title ?? "(untitled)",
      listing.category ?? "—",
      `${listing.currency ?? "GHS"} ${Number(listing.price ?? 0).toFixed(2)}`,
      listing.status ?? "—"
    ];
    for (const value of values) {
      const td = document.createElement("td");
      td.textContent = value;
      tr.append(td);
    }
    const actions = document.createElement("td");
    actions.append(
      actionButton("Publish", listing, "published"),
      actionButton("Reject", listing, "rejected", "reject"),
      actionButton("Archive", listing, "archived", "secondary")
    );
    tr.append(actions);
    listingRows.append(tr);
  }
}

function actionButton(label, listing, status, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  if (className) button.className = className;
  button.addEventListener("click", async () => {
    if (!confirm(`${label} "${listing.title}"?`)) return;
    button.disabled = true;
    // This update should fail for non-admins unless a trusted admin policy is configured.
    const { error } = await supabase.from("listings").update({ status }).eq("id", listing.id);
    button.disabled = false;
    if (error) {
      dashboardMessage.textContent = `Update blocked: ${error.message}. Configure trusted admin authorization before using moderation.`;
    } else {
      dashboardMessage.textContent = `Listing updated: ${listing.title} → ${status}`;
      await loadListings();
    }
  });
  return button;
}

const { data: { session } } = await supabase.auth.getSession();
if (session) await showDashboard();
