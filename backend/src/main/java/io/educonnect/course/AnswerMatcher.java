package io.educonnect.course;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Compares a learner's answer with the expected one, tolerating case, accents, extra whitespace and
 * trailing punctuation. The expected value may list several accepted answers separated by {@code |}.
 */
public final class AnswerMatcher {

    private static final Pattern DIACRITICS = Pattern.compile("\\p{M}+");
    private static final Pattern WHITESPACE = Pattern.compile("\\s+");
    private static final Pattern TRAILING_PUNCTUATION = Pattern.compile("[.!?;,]+$");

    private AnswerMatcher() {
    }

    public static boolean matches(String expected, String given) {
        if (expected == null || given == null) {
            return false;
        }
        String normalizedGiven = normalize(given);
        if (normalizedGiven.isEmpty()) {
            return false;
        }
        return Arrays.stream(expected.split("\\|"))
                .map(AnswerMatcher::normalize)
                .filter(candidate -> !candidate.isEmpty())
                .anyMatch(normalizedGiven::equals);
    }

    static String normalize(String value) {
        String decomposed = Normalizer.normalize(value, Normalizer.Form.NFD);
        String withoutAccents = DIACRITICS.matcher(decomposed).replaceAll("");
        String collapsed = WHITESPACE.matcher(withoutAccents.trim()).replaceAll(" ");
        return TRAILING_PUNCTUATION.matcher(collapsed).replaceAll("").toLowerCase(Locale.ROOT);
    }
}
