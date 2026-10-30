import os
import re
import sqlite3
import tempfile
import unittest
from unittest.mock import patch
from io import BytesIO
from pathlib import Path

TEST_DATA = tempfile.TemporaryDirectory()
os.environ["DATABASE_PATH"] = str(Path(TEST_DATA.name) / "fictionflix-test.sqlite3")
os.environ["UPLOAD_FOLDER"] = str(Path(TEST_DATA.name) / "uploads")
os.environ["OWNER_EMAIL"] = "owner@example.test"
os.environ["OWNER_SETUP_TOKEN"] = "fictionflix-test-owner-token"
os.environ.pop("APP_ENV", None)

import app as fictionflix


class FictionFlixApiTests(unittest.TestCase):
    def setUp(self):
        fictionflix.app.config.update(TESTING=True)
        connection = sqlite3.connect(fictionflix.DATABASE_PATH)
        try:
            connection.execute("DELETE FROM users")
            connection.execute("DELETE FROM content")
            connection.commit()
        finally:
            connection.close()
        self.client = fictionflix.app.test_client()

    def signup(self, email, name="Test Reader"):
        payload = {"name": name, "email": email, "password": "story-pass-1"}
        if email == os.environ.get("OWNER_EMAIL"):
            payload["ownerSetupToken"] = os.environ["OWNER_SETUP_TOKEN"]
        with patch.object(fictionflix, "send_account_verification_email") as send_email:
            response = self.client.post("/api/auth/signup", json=payload)
            if response.status_code != 201:
                return response
            token = send_email.call_args.args[2]
        verified = self.client.post("/api/auth/verify-email", json={"token": token})
        if verified.status_code != 200:
            return verified
        return self.client.post(
            "/api/auth/login",
            json={"email": email, "password": payload["password"]},
        )

    def test_mongodb_uri_encodes_raw_credentials_without_double_encoding(self):
        raw_uri = "mongodb+srv://reader:pa@ss/word#1@cluster.example.test/fictionflix"
        normalized = fictionflix.normalize_mongodb_uri(raw_uri)
        self.assertEqual(
            normalized,
            "mongodb+srv://reader:pa%40ss%2Fword%231@cluster.example.test/fictionflix",
        )
        self.assertEqual(
            fictionflix.normalize_mongodb_uri(normalized),
            normalized,
        )
        self.assertEqual(
            fictionflix.normalize_mongodb_uri(
                "mongodb://localhost:27017/fictionflix"
            ),
            "mongodb://localhost:27017/fictionflix",
        )

    def test_signup_login_and_logout(self):
        response = self.signup("owner@example.test", "Fiction Owner")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["user"]["role"], "owner")
        self.assertTrue(self.client.get("/api/studio/access").json["allowed"])

        self.client.post("/api/auth/logout")
        login = self.client.post(
            "/api/auth/login",
            json={"email": "owner@example.test", "password": "story-pass-1"},
        )
        self.assertEqual(login.status_code, 200)
        self.assertEqual(login.json["user"]["name"], "Fiction Owner")

        self.client.post("/api/auth/logout")
        self.assertEqual(self.client.get("/api/auth/me").status_code, 401)

    def test_logout_expires_session_cookie_and_refresh_stays_signed_out(self):
        self.signup("reader@example.test")
        self.assertEqual(self.client.get("/api/auth/me").status_code, 200)

        response = self.client.post("/api/auth/logout")

        self.assertEqual(response.status_code, 200)
        session_cookie = next(
            value for value in response.headers.getlist("Set-Cookie")
            if value.startswith("session=")
        )
        self.assertIn("Max-Age=0", session_cookie)
        self.assertEqual(self.client.get("/api/auth/me").status_code, 401)
        profile_response = self.client.get("/profile")
        self.assertEqual(profile_response.status_code, 302)
        self.assertEqual(profile_response.headers["Location"], "/login")
        self.assertEqual(self.client.get("/login").status_code, 200)

    def test_legacy_login_page_exposes_owner_setup_token_for_signup(self):
        response = self.client.get("/login")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'id="ownerSetupToken"', response.data)
        self.assertIn(b"body.ownerSetupToken = ownerSetupTokenInput.value", response.data)
        self.assertIn(b"dashboardByRole[result.user?.role] || '/'", response.data)

    def test_signup_requires_email_verification_before_login(self):
        with patch.object(fictionflix, "send_email_message") as send_email:
            signup = self.client.post(
                "/api/auth/signup",
                json={
                    "name": "Verify Reader",
                    "email": "verify@example.test",
                    "password": "story-pass-1",
                },
            )
            self.assertEqual(signup.status_code, 201)
            message = send_email.call_args.args[0]
            self.assertEqual(message["To"], "verify@example.test")
            match = re.search(r"/api/auth/verify-email\?token=([^\s]+)", message.get_content())
            self.assertIsNotNone(match)
            token = match.group(1)

        self.assertEqual(self.client.get("/api/auth/me").status_code, 401)
        rejected = self.client.post(
            "/api/auth/login",
            json={"email": "verify@example.test", "password": "story-pass-1"},
        )
        self.assertEqual(rejected.status_code, 403)
        self.assertEqual(rejected.json["code"], "email_not_verified")

        confirmed = self.client.get(
            "/api/auth/verify-email",
            query_string={"token": token},
        )
        self.assertEqual(confirmed.status_code, 302)
        self.assertEqual(confirmed.headers["Location"], "/login?verification=success")
        self.assertEqual(
            self.client.post(
                "/api/auth/login",
                json={"email": "verify@example.test", "password": "story-pass-1"},
            ).status_code,
            200,
        )
        repeated_confirmation = self.client.post(
            "/api/auth/verify-email",
            json={"token": token},
        )
        self.assertEqual(repeated_confirmation.status_code, 200)

    def test_signup_accepts_symbols_and_enforces_password_length(self):
        payload = {
            "name": "Password Reader",
            "email": "password-format@example.test",
        }
        for password in ("short1!", "x" * 129):
            response = self.client.post(
                "/api/auth/signup",
                json={**payload, "password": password},
            )
            self.assertEqual(response.status_code, 400)
            self.assertIn("between 8 and 128 characters", response.json["message"])

        with patch.object(fictionflix, "send_account_verification_email"):
            accepted = self.client.post(
                "/api/auth/signup",
                json={**payload, "password": "My-Strong!Pass1"},
            )
        self.assertEqual(accepted.status_code, 201)

    def test_verification_tokens_are_signed_and_expired_tokens_are_rejected(self):
        response = self.client.post("/api/auth/verify-email", json={"token": "invalid-token"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["message"], "This verification link is invalid or expired.")

        token = fictionflix.email_verification_serializer.dumps(
            {"user_id": "1", "email": "missing@example.test"},
            salt="fictionflix-email-verification",
        )
        with patch.object(fictionflix.email_verification_serializer, "loads", side_effect=fictionflix.SignatureExpired("expired")):
            response = self.client.post("/api/auth/verify-email", json={"token": token})
        self.assertEqual(response.status_code, 400)

    def test_unverified_user_can_resend_verification_email(self):
        with patch.object(fictionflix, "send_account_verification_email") as send_email:
            signup = self.client.post(
                "/api/auth/signup",
                json={
                    "name": "Pending Reader",
                    "email": "pending@example.test",
                    "password": "story-pass-1",
                },
            )
            self.assertEqual(signup.status_code, 201)
            send_email.reset_mock()
            resend = self.client.post(
                "/api/auth/verify-email/resend",
                json={"email": "PENDING@example.test"},
            )
        self.assertEqual(resend.status_code, 200)
        self.assertEqual(send_email.call_count, 1)
        self.assertEqual(send_email.call_args.args[:2], ("Pending Reader", "pending@example.test"))

    def test_signup_surfaces_missing_email_configuration_without_authenticating(self):
        with patch.object(
            fictionflix,
            "send_account_verification_email",
            side_effect=RuntimeError("Email delivery is not configured."),
        ):
            response = self.client.post(
                "/api/auth/signup",
                json={
                    "name": "Pending Reader",
                    "email": "pending@example.test",
                    "password": "story-pass-1",
                },
            )
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json["code"], "verification_email_unavailable")
        self.assertEqual(self.client.get("/api/auth/me").status_code, 401)

    def test_api_routes_reject_unauthenticated_requests_with_json_responses(self):
        response = self.client.get("/api/user/preferences")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json["message"], "Authentication required.")

        response = self.client.get("/api/user/library")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json["message"], "Authentication required.")

    def test_owner_account_cannot_be_claimed_without_the_setup_token(self):
        response = self.client.post(
            "/api/auth/signup",
            json={
                "name": "Impersonator",
                "email": "owner@example.test",
                "password": "story-pass-1",
            },
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.client.get("/api/studio/access").json["allowed"], False)

    def test_existing_owner_email_can_be_bootstrapped_only_with_the_token(self):
        previous_owner_email = os.environ["OWNER_EMAIL"]
        os.environ["OWNER_EMAIL"] = ""
        try:
            created = self.signup("owner@example.test", "Fiction Owner")
            self.assertEqual(created.status_code, 200)
            self.assertEqual(created.json["user"]["role"], "user")
            os.environ["OWNER_EMAIL"] = previous_owner_email

            denied = self.client.post(
                "/api/studio/bootstrap-owner",
                json={"token": "wrong-token"},
            )
            self.assertEqual(denied.status_code, 403)
            claimed = self.client.post(
                "/api/studio/bootstrap-owner",
                json={"token": os.environ["OWNER_SETUP_TOKEN"]},
            )
            self.assertEqual(claimed.status_code, 200)
            self.assertEqual(claimed.json["user"]["role"], "owner")
        finally:
            os.environ["OWNER_EMAIL"] = previous_owner_email

    def test_profile_update_persists(self):
        self.signup("reader@example.test")
        profile = self.client.get("/User.html")
        self.assertEqual(profile.status_code, 200)
        self.assertIn(b"Test Reader", profile.data)
        self.assertIn(b'id="profileImageInput"', profile.data)
        self.assertIn(b'id="avatarInitial"', profile.data)
        self.assertNotIn(b"Mysterious Mansion", profile.data)
        self.assertNotIn(b"The Final Station", profile.data)

        response = self.client.post(
            "/update_profile",
            json={"name": "Updated Reader", "email": "updated@example.test"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.get("/api/auth/me").json["user"]["email"], "updated@example.test")

    def test_profile_picture_upload_is_authenticated_and_persists_across_login(self):
        unauthorized = self.client.post(
            "/api/user/profile-image",
            data={"file": (BytesIO(b"image-bytes"), "avatar.png", "image/png")},
            content_type="multipart/form-data",
        )
        self.assertEqual(unauthorized.status_code, 401)

        self.signup("reader@example.test")
        uploaded = self.client.post(
            "/api/user/profile-image",
            data={"file": (BytesIO(b"image-bytes"), "avatar.png", "image/png")},
            content_type="multipart/form-data",
        )
        self.assertEqual(uploaded.status_code, 200)
        profile_image = uploaded.json["profileImage"]
        filename = profile_image.rsplit("/", 1)[-1]
        self.assertTrue(Path(fictionflix.UPLOAD_FOLDER, filename).is_file())
        self.assertIn(profile_image.encode(), self.client.get("/User.html").data)
        self.assertEqual(self.client.get(profile_image).data, b"image-bytes")

        self.client.post("/api/auth/logout")
        login = self.client.post(
            "/api/auth/login",
            json={"email": "reader@example.test", "password": "story-pass-1"},
        )
        self.assertEqual(login.status_code, 200)
        self.assertEqual(login.json["user"]["profileImage"], profile_image)
        self.assertIn(profile_image.encode(), self.client.get("/User.html").data)

    def test_profile_picture_upload_rejects_unsupported_file_types(self):
        self.signup("reader@example.test")
        response = self.client.post(
            "/api/user/profile-image",
            data={"file": (BytesIO(b"not-an-image"), "avatar.gif", "image/gif")},
            content_type="multipart/form-data",
        )
        self.assertEqual(response.status_code, 400)

    def test_account_preferences_are_stored_per_account(self):
        self.signup("reader@example.test", "Real Reader")
        initial = self.client.get("/api/user/preferences")
        self.assertEqual(initial.status_code, 200)
        self.assertEqual(initial.json["preferredLanguage"], "hi")

        updated = self.client.put(
            "/api/user/preferences",
            json={"preferredLanguage": "bn", "contentPreference": "micro-vertical-drama"},
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(self.client.get("/api/user/preferences").json["preferredLanguage"], "bn")

    def test_saved_stories_and_reading_history_are_account_scoped(self):
        self.signup("reader@example.test", "Real Reader")
        saved = self.client.put(
            "/api/user/library/story-1",
            json={
                "title": "Real Story",
                "poster": "/assets/story.png",
                "genre": "Mystery",
                "saved": True,
            },
        )
        self.assertEqual(saved.status_code, 200)
        self.assertTrue(saved.json["item"]["saved"])

        progress = self.client.put(
            "/api/user/library/story-1",
            json={"title": "Real Story", "mode": "book", "beat": 12},
        )
        self.assertEqual(progress.status_code, 200)
        self.assertEqual(progress.json["item"]["beat"], 12)

        items = self.client.get("/api/user/library").json["items"]
        self.assertEqual(len(items), 1)
        self.assertTrue(items[0]["saved"])
        self.assertEqual(items[0]["title"], "Real Story")
        self.assertEqual(items[0]["mode"], "book")

        self.client.post("/api/auth/logout")
        self.signup("other@example.test", "Other Reader")
        self.assertEqual(self.client.get("/api/user/library").json["items"], [])

    def test_content_is_persisted_and_publication_is_enforced(self):
        self.signup("owner@example.test")
        shows = [
            {"id": "published", "title": "Public story", "status": "Published"},
            {"id": "draft", "title": "Private story", "status": "Draft"},
        ]
        save = self.client.put("/api/content/managed/shows", json={"items": shows})
        self.assertEqual(save.status_code, 200)

        self.client.post("/api/auth/logout")
        public = self.client.get("/api/content/public")
        self.assertEqual(public.status_code, 200)
        self.assertEqual([show["id"] for show in public.json["stories"]], ["published"])
        self.assertEqual(self.client.get("/api/content/managed").status_code, 401)

    def test_content_item_ids_reject_boolean_values(self):
        self.signup("owner@example.test")
        response = self.client.put(
            "/api/content/managed/shows",
            json={"items": [{"id": True, "title": "Boolean-id story", "status": "Published"}]},
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["message"], "Every content item needs an ID.")

    def test_team_role_changes_take_effect_without_signing_out(self):
        self.signup("owner@example.test")
        team_client = fictionflix.app.test_client()
        with patch.object(fictionflix, "send_account_verification_email") as send_email:
            team_signup = team_client.post(
                "/api/auth/signup",
                json={
                    "name": "Team Member",
                    "email": "team@example.test",
                    "password": "story-pass-1",
                },
            )
            self.assertEqual(team_signup.status_code, 201)
            verification_token = send_email.call_args.args[2]
        self.assertEqual(
            team_client.post(
                "/api/auth/verify-email",
                json={"token": verification_token},
            ).status_code,
            200,
        )
        self.assertEqual(
            team_client.post(
                "/api/auth/login",
                json={"email": "team@example.test", "password": "story-pass-1"},
            ).status_code,
            200,
        )
        self.assertEqual(team_client.get("/api/content/managed").status_code, 403)

        grant = self.client.put(
            "/api/studio/roles",
            json={"email": "team@example.test", "role": "team"},
        )
        self.assertEqual(grant.status_code, 200)
        self.assertEqual(team_client.get("/api/content/managed").status_code, 200)

        revoke = self.client.put(
            "/api/studio/roles",
            json={"email": "team@example.test", "role": "user"},
        )
        self.assertEqual(revoke.status_code, 200)
        self.assertEqual(team_client.get("/api/content/managed").status_code, 403)

    def test_non_owner_cannot_change_roles(self):
        self.signup("reader@example.test")
        response = self.client.put(
            "/api/studio/roles",
            json={"email": "reader@example.test", "role": "team"},
        )
        self.assertEqual(response.status_code, 403)

    def test_dashboard_role_matrix_is_enforced_by_the_server(self):
        route_roles = {
            "member": {"member", "owner", "admin"},
            "team": {"team", "owner", "admin"},
            "owner": {"owner", "admin"},
            "admin": {"admin"},
        }
        expected_by_role = {
            "user": {"member": 403, "team": 403, "owner": 403, "admin": 403},
            "member": {"member": 200, "team": 403, "owner": 403, "admin": 403},
            "team": {"member": 403, "team": 200, "owner": 403, "admin": 403},
            "owner": {"member": 200, "team": 200, "owner": 200, "admin": 403},
            "admin": {"member": 200, "team": 200, "owner": 200, "admin": 200},
        }
        paths = {role: f"/api/dashboard/{role}" for role in route_roles}

        for role, expected in expected_by_role.items():
            email = f"rbac-{role}@example.test"
            login = self.signup(email)
            self.assertEqual(login.status_code, 200)
            self.assertEqual(login.json["user"]["role"], "user")
            connection = sqlite3.connect(fictionflix.DATABASE_PATH)
            try:
                connection.execute("UPDATE users SET role = ? WHERE email = ?", (role, email))
                connection.commit()
            finally:
                connection.close()
            self.client.post("/api/auth/logout")
            self.assertEqual(
                self.client.post(
                    "/api/auth/login",
                    json={"email": email, "password": "story-pass-1"},
                ).status_code,
                200,
            )
            for dashboard_role, expected_status in expected.items():
                response = self.client.get(paths[dashboard_role])
                self.assertEqual(
                    response.status_code,
                    expected_status,
                    f"{role} role access to {dashboard_role} dashboard",
                )
                if expected_status == 200:
                    self.assertEqual(response.json["user"]["role"], role)
                    self.assertEqual(response.json["dashboard"], dashboard_role)

        self.client.post("/api/auth/logout")
        self.assertEqual(self.client.get(paths["member"]).status_code, 401)

    def test_owner_dashboard_page_is_owner_only_and_shows_signed_in_owner(self):
        signed_out = self.client.get("/dashboard/owner")
        self.assertEqual(signed_out.status_code, 302)
        self.assertEqual(signed_out.headers["Location"], "/login")

        self.signup("reader@example.test", "Regular Reader")
        self.assertEqual(self.client.get("/dashboard/owner").status_code, 403)

        self.client.post("/api/auth/logout")
        self.signup("owner@example.test", "Fiction Owner")
        response = self.client.get("/dashboard/owner")

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Fiction Owner", response.data)
        self.assertIn(b"Owner Dashboard", response.data)

    def test_owner_can_provision_admin_and_admin_can_update_roles(self):
        self.signup("owner@example.test")
        target_client = fictionflix.app.test_client()
        with patch.object(fictionflix, "send_account_verification_email") as send_email:
            target_client_signup = target_client.post(
                "/api/auth/signup",
                json={
                    "name": "Role Target",
                    "email": "role-target@example.test",
                    "password": "story-pass-1",
                },
            )
            verification_token = send_email.call_args.args[2]
        self.assertEqual(target_client_signup.status_code, 201)
        self.assertEqual(
            target_client.post(
                "/api/auth/verify-email",
                json={"token": verification_token},
            ).status_code,
            200,
        )
        self.assertEqual(
            target_client.post(
                "/api/auth/login",
                json={"email": "role-target@example.test", "password": "story-pass-1"},
            ).status_code,
            200,
        )

        owner_update = self.client.put(
            "/api/studio/roles",
            json={"email": "role-target@example.test", "role": "admin"},
        )
        self.assertEqual(owner_update.status_code, 200)
        self.assertEqual(
            target_client.get("/api/dashboard/admin").status_code,
            200,
        )

        owner_cannot_use_admin_api = self.client.put(
            "/api/admin/update-role",
            json={"email": "role-target@example.test", "role": "member"},
        )
        self.assertEqual(owner_cannot_use_admin_api.status_code, 403)

        invalid_role = target_client.put(
            "/api/admin/update-role",
            json={"email": "role-target@example.test", "role": "superuser"},
        )
        self.assertEqual(invalid_role.status_code, 400)
        update = target_client.put(
            "/api/admin/update-role",
            json={"email": "role-target@example.test", "role": "member"},
        )
        self.assertEqual(update.status_code, 200)
        self.assertEqual(target_client.get("/api/dashboard/member").status_code, 200)
        self.assertEqual(target_client.get("/api/dashboard/admin").status_code, 403)
        self.assertEqual(
            self.client.put(
                "/api/studio/roles",
                json={"email": "role-target@example.test", "role": "superuser"},
            ).status_code,
            400,
        )

    def test_artwork_upload_requires_studio_access(self):
        response = self.client.post(
            "/api/studio/uploads",
            data={"kind": "poster", "file": (BytesIO(b"image"), "poster.png", "image/png")},
            content_type="multipart/form-data",
        )
        self.assertEqual(response.status_code, 401)

        self.signup("owner@example.test")
        response = self.client.post(
            "/api/studio/uploads",
            data={"kind": "poster", "file": (BytesIO(b"image"), "poster.png", "image/png")},
            content_type="multipart/form-data",
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Path(fictionflix.UPLOAD_FOLDER, response.json["url"].split("/")[-1]).is_file())

    def test_password_reset_reports_missing_email_setup(self):
        self.signup("reader@example.test")
        self.client.post("/api/auth/logout")
        response = self.client.post(
            "/api/auth/reset-password",
            json={"email": "reader@example.test"},
        )
        self.assertEqual(response.status_code, 503)
        self.assertIn("not configured", response.json["message"])

    def test_password_reset_token_updates_the_password(self):
        self.signup("reader@example.test")
        self.client.post("/api/auth/logout")
        token = fictionflix.password_reset_serializer.dumps(
            "reader@example.test",
            salt="fictionflix-password-reset",
        )
        response = self.client.post(
            "/api/auth/reset-password/confirm",
            json={"token": token, "password": "new-story-pass-2"},
        )
        self.assertEqual(response.status_code, 200)
        login = self.client.post(
            "/api/auth/login",
            json={"email": "reader@example.test", "password": "new-story-pass-2"},
        )
        self.assertEqual(login.status_code, 200)


if __name__ == "__main__":
    unittest.main()
