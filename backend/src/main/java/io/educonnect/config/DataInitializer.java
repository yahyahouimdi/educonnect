package io.educonnect.config;

import io.educonnect.course.Chapter;
import io.educonnect.course.Course;
import io.educonnect.course.CourseRepository;
import io.educonnect.course.Exercise;
import io.educonnect.news.NewsArticle;
import io.educonnect.news.NewsRepository;
import io.educonnect.site.SiteSettingsService;
import io.educonnect.user.Role;
import io.educonnect.user.User;
import io.educonnect.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

/**
 * Makes a fresh installation usable immediately: creates the site settings, the first administrator
 * and (optionally) a small demo catalog so the website is not empty on first launch.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private static final String DEFAULT_ADMIN_PASSWORD = "Admin@12345";

    private final AppProperties properties;
    private final SiteSettingsService siteSettingsService;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final NewsRepository newsRepository;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        siteSettingsService.ensureInitialized();
        User admin = ensureAdministrator();
        if (properties.bootstrap().demoData() && courseRepository.count() == 0) {
            seedDemoContent(admin);
        }
    }

    private User ensureAdministrator() {
        AppProperties.Bootstrap bootstrap = properties.bootstrap();
        return userRepository.findByEmailIgnoreCase(bootstrap.adminEmail()).orElseGet(() -> {
            if (userRepository.countByRole(Role.ADMIN) > 0) {
                return null;
            }
            log.info("Creating initial administrator account {}", bootstrap.adminEmail());
            if (DEFAULT_ADMIN_PASSWORD.equals(bootstrap.adminPassword())) {
                log.warn("The administrator uses the default password. Set ADMIN_PASSWORD before going to production.");
            }
            return userRepository.save(new User(bootstrap.adminName(), bootstrap.adminEmail().toLowerCase(),
                    passwordEncoder.encode(bootstrap.adminPassword()), Role.ADMIN));
        });
    }

    private void seedDemoContent(User admin) {
        log.info("Seeding demo content (set DEMO_DATA=false to disable)");

        User teacher = createUserIfAbsent("Sarah Ben Ali", "teacher@educonnect.local", "Teacher@12345", Role.TEACHER);
        createUserIfAbsent("Adam Student", "student@educonnect.local", "Student@12345", Role.STUDENT);

        Course java = course("Introduction to Java Programming", "Programming",
                "Learn the fundamentals of object-oriented programming with Java.",
                "A hands-on introduction to Java: syntax, types, classes and objects. Each chapter ends with short "
                        + "exercises so you can check your understanding before moving on.",
                teacher, 1);
        chapter(java, "Getting started", """
                ## What is Java?

                Java is a general-purpose, **object-oriented** programming language. Programs are compiled to
                *bytecode* which runs on the **Java Virtual Machine (JVM)**, so the same program runs on any
                operating system.

                ```java
                public class Hello {
                    public static void main(String[] args) {
                        System.out.println("Hello, world!");
                    }
                }
                ```

                Every Java application starts from a `main` method.
                """,
                exercise("Which keyword declares a class in Java?", "class", "It is literally the word used in the example."),
                exercise("What is the name of the virtual machine that runs Java bytecode? (acronym)", "JVM|Java Virtual Machine", null),
                exercise("Which method is the entry point of a Java application?", "main|main()", null));
        chapter(java, "Variables and types", """
                ## Primitive types

                Java is statically typed: every variable has a type known at compile time.

                | Type      | Example        |
                |-----------|----------------|
                | `int`     | `int age = 20;` |
                | `double`  | `double pi = 3.14;` |
                | `boolean` | `boolean ok = true;` |
                | `char`    | `char grade = 'A';` |

                Text is represented by the `String` class: `String name = "Ada";`
                """,
                exercise("Which primitive type stores whole numbers such as 42?", "int", "Short for integer."),
                exercise("Which type stores true/false values?", "boolean", null));
        chapter(java, "Classes and objects", """
                ## From classes to objects

                A **class** is a blueprint; an **object** is an instance created from it with the `new` keyword.

                ```java
                Student s = new Student("Ada");
                ```

                A **constructor** is a special method that initialises a new object.
                """,
                exercise("Which keyword creates a new object?", "new", null),
                exercise("What do we call the special method that initialises an object?", "constructor|a constructor", null));

        Course web = course("Web Development Fundamentals", "Web",
                "Build your first web pages with HTML, CSS and JavaScript.",
                "Discover how the web works and create responsive pages using the three core web technologies.",
                teacher, 2);
        chapter(web, "How the web works", """
                ## Clients and servers

                Your browser (the **client**) sends an **HTTP request** to a **server**, which answers with an
                **HTTP response** — usually an HTML document.
                """,
                exercise("Which protocol does the browser use to talk to web servers? (acronym)", "HTTP|HTTPS", null));
        chapter(web, "HTML basics", """
                ## Structure with HTML

                HTML describes the structure of a page using **elements** such as `<h1>`, `<p>` and `<a>`.
                """,
                exercise("Which HTML element creates a hyperlink? (tag name only)", "a|<a>", "It is a single letter."),
                exercise("Which language is used to style web pages? (acronym)", "CSS", null));

        courseRepository.save(java);
        courseRepository.save(web);

        Instant now = clock.instant();
        news(admin, "Welcome to our new digital campus",
                "Our new website and e-learning platform are now online.",
                """
                We are proud to launch our new website. Students can now follow courses online, download course
                material, chat with classmates and teachers, and get help from an AI teaching assistant.

                Sign in with the credentials provided by the administration to get started.
                """, now);
        news(admin, "Registrations for the new academic year are open",
                "Applications are accepted until the end of the month.",
                "Prospective students can contact the administration through the **Contact** page for any question "
                        + "about programmes, admission requirements and fees.",
                now.minus(Duration.ofDays(3)));
        news(admin, "Open day on campus",
                "Meet our teachers and discover our programmes.",
                "Join us for guided tours, workshops and presentations of every department.",
                now.minus(Duration.ofDays(10)));
    }

    private User createUserIfAbsent(String name, String email, String password, Role role) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseGet(() -> userRepository.save(new User(name, email, passwordEncoder.encode(password), role)));
    }

    private static Course course(String title, String category, String summary, String description, User teacher,
                                 int position) {
        Course course = new Course();
        course.setTitle(title);
        course.setCategory(category);
        course.setSummary(summary);
        course.setDescription(description);
        course.setTeacher(teacher);
        course.setPublished(true);
        course.setPosition(position);
        return course;
    }

    private static void chapter(Course course, String title, String content, Exercise... exercises) {
        Chapter chapter = new Chapter();
        chapter.setCourse(course);
        chapter.setTitle(title);
        chapter.setContent(content.strip());
        chapter.setPosition(course.getChapters().size() + 1);
        for (Exercise exercise : exercises) {
            exercise.setChapter(chapter);
            exercise.setPosition(chapter.getExercises().size() + 1);
            chapter.getExercises().add(exercise);
        }
        course.getChapters().add(chapter);
    }

    private static Exercise exercise(String question, String answer, String hint) {
        Exercise exercise = new Exercise();
        exercise.setQuestion(question);
        exercise.setAnswer(answer);
        exercise.setHint(hint);
        return exercise;
    }

    private void news(User author, String title, String summary, String content, Instant publishedAt) {
        NewsArticle article = new NewsArticle();
        article.setTitle(title);
        article.setSummary(summary);
        article.setContent(content.strip());
        article.setPublished(true);
        article.setPublishedAt(publishedAt);
        article.setAuthor(author);
        newsRepository.save(article);
    }
}
