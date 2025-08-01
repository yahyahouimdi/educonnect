package io.educonnect.chat;

import io.educonnect.common.BaseEntity;
import io.educonnect.user.Role;
import io.educonnect.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "chat_messages")
public class ChatMessage extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    private User sender;

    /** Denormalized so history stays readable after the sender account is deleted. */
    @Column(name = "sender_name", nullable = false, length = 150)
    private String senderName;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "sender_role", nullable = false, length = 20)
    private Role senderRole;

    @Column(nullable = false, length = 2000)
    private String content;
}
