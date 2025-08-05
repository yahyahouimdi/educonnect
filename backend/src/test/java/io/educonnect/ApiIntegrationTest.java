package io.educonnect;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasKey;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end API tests against an in-memory database seeded with the demo data.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ApiIntegrationTest {

    private static final String ADMIN = "admin@educonnect.local";
    private static final String TEACHER = "teacher@educonnect.local";
    private static final String STUDENT = "student@educonnect.local";

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    // ---- Public website -------------------------------------------------------------------------

    @Test
    void publicSiteInformationIsAvailableWithoutAuthentication() throws Exception {
        mvc.perform(get("/api/v1/site"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("EduConnect Academy"))
                .andExpect(jsonPath("$.primaryColor").value("#1d4ed8"))
                .andExpect(jsonPath("$.features.assistant").value(false));

        mvc.perform(get("/api/v1/site/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.courses").value(greaterThanOrEqualTo(2)));

        mvc.perform(get("/api/v1/news"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(greaterThanOrEqualTo(3)));

        mvc.perform(get("/api/v1/courses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Introduction to Java Programming"));
    }

    @Test
    void contactFormStoresMessagesForAdministrators() throws Exception {
        mvc.perform(post("/api/v1/contact").contentType(MediaType.APPLICATION_JSON).content(json(Map.of(
                        "name", "Visitor", "email", "visitor@example.com", "subject", "Admissions",
                        "message", "When does registration close?"))))
                .andExpect(status().isAccepted());

        mvc.perform(post("/api/v1/contact").contentType(MediaType.APPLICATION_JSON).content(json(Map.of(
                        "name", "", "email", "not-an-email", "subject", "x", "message", "y"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors", hasKey("email")))
                .andExpect(jsonPath("$.errors", hasKey("name")));

        mvc.perform(authorized(get("/api/v1/admin/contact-messages"), ADMIN, "Admin@12345"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].subject").value("Admissions"));
    }

    // ---- Authentication -------------------------------------------------------------------------

    @Test
    void loginRejectsInvalidCredentials() throws Exception {
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", ADMIN, "password", "wrong-password"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Invalid email or password"));
    }

    @Test
    void protectedEndpointsRequireAuthenticationAndRoles() throws Exception {
        mvc.perform(get("/api/v1/learning/progress")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/learning/progress").header(HttpHeaders.AUTHORIZATION, "Bearer not-a-token"))
                .andExpect(status().isUnauthorized());

        mvc.perform(authorized(get("/api/v1/admin/courses"), STUDENT, "Student@12345"))
                .andExpect(status().isForbidden());
        mvc.perform(authorized(get("/api/v1/admin/users"), TEACHER, "Teacher@12345"))
                .andExpect(status().isForbidden());
        mvc.perform(authorized(get("/api/v1/admin/courses"), TEACHER, "Teacher@12345"))
                .andExpect(status().isOk());
    }

    @Test
    void currentUserProfileIsReturned() throws Exception {
        mvc.perform(authorized(get("/api/v1/auth/me"), STUDENT, "Student@12345"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("STUDENT"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    // ---- Learning -------------------------------------------------------------------------------

    @Test
    void studentCompletesExercisesAndProgressIsTracked() throws Exception {
        String token = login(STUDENT, "Student@12345");
        long courseId = firstCourseId();

        JsonNode course = readJson(mvc.perform(get("/api/v1/learning/courses/" + courseId).header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.chapters[0].exercises[0].answer").doesNotExist())
                .andReturn().getResponse().getContentAsString());
        long exerciseId = course.at("/chapters/0/exercises/0/id").asLong();

        mvc.perform(post("/api/v1/learning/exercises/" + exerciseId + "/attempts")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("answer", "interface"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correct").value(false));

        mvc.perform(post("/api/v1/learning/exercises/" + exerciseId + "/attempts")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("answer", "  Class "))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correct").value(true))
                .andExpect(jsonPath("$.courseProgress.completedExercises").value(greaterThanOrEqualTo(1)));

        mvc.perform(get("/api/v1/learning/courses/" + courseId).header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(jsonPath("$.chapters[0].exercises[0].completed").value(true));
    }

    // ---- Administration -------------------------------------------------------------------------

    @Test
    void administratorManagesUsers() throws Exception {
        String token = login(ADMIN, "Admin@12345");
        String body = json(Map.of("fullName", "New Student", "email", "New.Student@Example.com",
                "password", "Secret@123", "role", "STUDENT"));

        JsonNode created = readJson(mvc.perform(post("/api/v1/admin/users").header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("new.student@example.com"))
                .andReturn().getResponse().getContentAsString());

        mvc.perform(post("/api/v1/admin/users").header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());

        String newToken = login("new.student@example.com", "Secret@123");
        assertThat(newToken).isNotBlank();

        mvc.perform(put("/api/v1/admin/users/" + created.get("id").asLong()).header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("fullName", "New Student",
                                "email", "new.student@example.com", "role", "STUDENT", "enabled", false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false));

        // A disabled account loses access immediately, even with a token issued before.
        mvc.perform(get("/api/v1/auth/me").header(HttpHeaders.AUTHORIZATION, bearer(newToken)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void teacherCanOnlyManageOwnCourses() throws Exception {
        String admin = login(ADMIN, "Admin@12345");
        JsonNode unassigned = readJson(mvc.perform(post("/api/v1/admin/courses").header(HttpHeaders.AUTHORIZATION, bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("title", "Admin course",
                                "published", false, "position", 9))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString());

        String teacher = login(TEACHER, "Teacher@12345");
        mvc.perform(get("/api/v1/admin/courses/" + unassigned.get("id").asLong()).header(HttpHeaders.AUTHORIZATION, bearer(teacher)))
                .andExpect(status().isForbidden());

        JsonNode own = readJson(mvc.perform(post("/api/v1/admin/courses").header(HttpHeaders.AUTHORIZATION, bearer(teacher))
                        .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("title", "Teacher course",
                                "published", true, "position", 10))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.teacherName").value("Sarah Ben Ali"))
                .andReturn().getResponse().getContentAsString());

        long chapterId = readJson(mvc.perform(post("/api/v1/admin/courses/" + own.get("id").asLong() + "/chapters")
                        .header(HttpHeaders.AUTHORIZATION, bearer(teacher))
                        .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("title", "Chapter 1",
                                "content", "# Hello", "position", 1))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString()).get("id").asLong();

        mvc.perform(post("/api/v1/admin/chapters/" + chapterId + "/exercises")
                        .header(HttpHeaders.AUTHORIZATION, bearer(teacher))
                        .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("question", "2 + 2 = ?",
                                "answer", "4|four", "position", 1))))
                .andExpect(status().isCreated());

        mvc.perform(delete("/api/v1/admin/courses/" + own.get("id").asLong()).header(HttpHeaders.AUTHORIZATION, bearer(teacher)))
                .andExpect(status().isNoContent());
    }

    @Test
    void resourcesCanBeUploadedAndDownloaded() throws Exception {
        String teacher = login(TEACHER, "Teacher@12345");
        MockMultipartFile file = new MockMultipartFile("file", "syllabus.txt", "text/plain", "Week 1: Java".getBytes());

        JsonNode uploaded = readJson(mvc.perform(multipart("/api/v1/admin/resources").file(file)
                        .param("title", "Syllabus")
                        .header(HttpHeaders.AUTHORIZATION, bearer(teacher)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.filename").value("syllabus.txt"))
                .andReturn().getResponse().getContentAsString());

        mvc.perform(authorized(get("/api/v1/resources/" + uploaded.get("id").asLong() + "/download"), STUDENT, "Student@12345"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, org.hamcrest.Matchers.containsString("syllabus.txt")));

        mvc.perform(authorized(delete("/api/v1/admin/resources/" + uploaded.get("id").asLong()), ADMIN, "Admin@12345"))
                .andExpect(status().isNoContent());
    }

    @Test
    void siteSettingsAreEditableByAdministrators() throws Exception {
        String admin = login(ADMIN, "Admin@12345");
        Map<String, Object> settings = Map.of("name", "Institut Supérieur Demo", "shortName", "ISD",
                "primaryColor", "#0F766E", "website", "https://example.org");

        mvc.perform(put("/api/v1/admin/site").header(HttpHeaders.AUTHORIZATION, bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(json(settings)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.primaryColor").value("#0f766e"));

        mvc.perform(put("/api/v1/admin/site").header(HttpHeaders.AUTHORIZATION, bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("name", "x", "shortName", "x",
                                "primaryColor", "blue"))))
                .andExpect(status().isBadRequest());

        mvc.perform(put("/api/v1/admin/site").header(HttpHeaders.AUTHORIZATION, bearer(admin))
                .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("name", "EduConnect Academy",
                        "shortName", "EduConnect", "primaryColor", "#1d4ed8"))));
    }

    // ---- Helpers --------------------------------------------------------------------------------

    private MockHttpServletRequestBuilder authorized(MockHttpServletRequestBuilder request, String email, String password)
            throws Exception {
        return request.header(HttpHeaders.AUTHORIZATION, bearer(login(email, password)));
    }

    private String login(String email, String password) throws Exception {
        String response = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return readJson(response).get("accessToken").asText();
    }

    private long firstCourseId() throws Exception {
        return readJson(mvc.perform(get("/api/v1/courses")).andReturn().getResponse().getContentAsString())
                .get(0).get("id").asLong();
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }

    private JsonNode readJson(String value) throws Exception {
        return objectMapper.readTree(value);
    }
}
