package io.educonnect.course;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

class AnswerMatcherTest {

    @ParameterizedTest(name = "expected \"{0}\", given \"{1}\" -> {2}")
    @CsvSource(delimiter = ';', value = {
            "class; class; true",
            "class; '  CLASS  '; true",
            "class; class.; true",
            "JVM|Java Virtual Machine; java   virtual machine; true",
            "JVM|Java Virtual Machine; jvm; true",
            "élève; eleve; true",
            "class; classes; false",
            "class; ''; false",
            "a||b; ''; false",
    })
    void matchesAnswers(String expected, String given, boolean matches) {
        assertThat(AnswerMatcher.matches(expected, given)).isEqualTo(matches);
    }
}
