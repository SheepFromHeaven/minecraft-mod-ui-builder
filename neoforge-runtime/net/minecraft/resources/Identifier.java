package net.minecraft.resources;

import com.mojang.brigadier.StringReader;
import com.mojang.brigadier.exceptions.CommandSyntaxException;
import com.mojang.brigadier.exceptions.SimpleCommandExceptionType;
import com.mojang.serialization.Codec;
import com.mojang.serialization.DataResult;
import io.netty.buffer.ByteBuf;
import java.util.function.UnaryOperator;
import net.minecraft.IdentifierException;
import net.minecraft.network.chat.Component;
import net.minecraft.network.codec.ByteBufCodecs;
import net.minecraft.network.codec.StreamCodec;
import org.jspecify.annotations.Nullable;

public final class Identifier implements Comparable<Identifier> {
    public static final Codec<Identifier> CODEC = Codec.STRING.<Identifier>comapFlatMap(Identifier::read, Identifier::toString).stable();
    public static final StreamCodec<ByteBuf, Identifier> STREAM_CODEC = ByteBufCodecs.STRING_UTF8.map(Identifier::parse, Identifier::toString);
    public static final SimpleCommandExceptionType ERROR_INVALID = new SimpleCommandExceptionType(Component.translatable("argument.id.invalid"));
    public static final char NAMESPACE_SEPARATOR = ':';
    public static final String DEFAULT_NAMESPACE = "minecraft";
    public static final String REALMS_NAMESPACE = "realms";
    private final String namespace;
    private final String path;

    private Identifier(String p_469517_, String p_468299_) {
        assert isValidNamespace(p_469517_);

        assert isValidPath(p_468299_);

        this.namespace = p_469517_;
        this.path = p_468299_;
    }

    private static Identifier createUntrusted(String p_467737_, String p_467528_) {
        return new Identifier(assertValidNamespace(p_467737_, p_467528_), assertValidPath(p_467737_, p_467528_));
    }

    public static Identifier fromNamespaceAndPath(String p_469034_, String p_467016_) {
        return createUntrusted(p_469034_, p_467016_);
    }

    public static Identifier parse(String p_468155_) {
        return bySeparator(p_468155_, ':');
    }

    public static Identifier withDefaultNamespace(String p_466943_) {
        return new Identifier("minecraft", assertValidPath("minecraft", p_466943_));
    }

    public static @Nullable Identifier tryParse(String p_467284_) {
        return tryBySeparator(p_467284_, ':');
    }

    public static @Nullable Identifier tryBuild(String p_469621_, String p_468583_) {
        return isValidNamespace(p_469621_) && isValidPath(p_468583_) ? new Identifier(p_469621_, p_468583_) : null;
    }

    public static Identifier bySeparator(String p_466828_, char p_466951_) {
        int i = p_466828_.indexOf(p_466951_);
        if (i >= 0) {
            String s = p_466828_.substring(i + 1);
            if (i != 0) {
                String s1 = p_466828_.substring(0, i);
                return createUntrusted(s1, s);
            } else {
                return withDefaultNamespace(s);
            }
        } else {
            return withDefaultNamespace(p_466828_);
        }
    }

    public static @Nullable Identifier tryBySeparator(String p_468036_, char p_468702_) {
        int i = p_468036_.indexOf(p_468702_);
        if (i >= 0) {
            String s = p_468036_.substring(i + 1);
            if (!isValidPath(s)) {
                return null;
            } else if (i != 0) {
                String s1 = p_468036_.substring(0, i);
                return isValidNamespace(s1) ? new Identifier(s1, s) : null;
            } else {
                return new Identifier("minecraft", s);
            }
        } else {
            return isValidPath(p_468036_) ? new Identifier("minecraft", p_468036_) : null;
        }
    }

    public static DataResult<Identifier> read(String p_469432_) {
        try {
            return DataResult.success(parse(p_469432_));
        } catch (IdentifierException identifierexception) {
            return DataResult.error(() -> "Not a valid resource location: " + p_469432_ + " " + identifierexception.getMessage());
        }
    }

    public String getPath() {
        return this.path;
    }

    public String getNamespace() {
        return this.namespace;
    }

    public Identifier withPath(String p_469175_) {
        return new Identifier(this.namespace, assertValidPath(this.namespace, p_469175_));
    }

    public Identifier withPath(UnaryOperator<String> p_468153_) {
        return this.withPath(p_468153_.apply(this.path));
    }

    public Identifier withPrefix(String p_469098_) {
        return this.withPath(p_469098_ + this.path);
    }

    public Identifier withSuffix(String p_466935_) {
        return this.withPath(this.path + p_466935_);
    }

    @Override
    public String toString() {
        return this.namespace + ":" + this.path;
    }

    @Override
    public boolean equals(Object p_468123_) {
        if (this == p_468123_) {
            return true;
        } else {
            return !(p_468123_ instanceof Identifier identifier) ? false : this.namespace.equals(identifier.namespace) && this.path.equals(identifier.path);
        }
    }

    @Override
    public int hashCode() {
        return 31 * this.namespace.hashCode() + this.path.hashCode();
    }

    public int compareTo(Identifier p_469021_) {
        int i = this.path.compareTo(p_469021_.path);
        if (i == 0) {
            i = this.namespace.compareTo(p_469021_.namespace);
        }

        return i;
    }

    // Normal compare sorts by path first, this compares namespace first.
    public int compareNamespaced(Identifier o) {
        int ret = this.namespace.compareTo(o.namespace);
        return ret != 0 ? ret : this.path.compareTo(o.path);
    }

    public String toDebugFileName() {
        return this.toString().replace('/', '_').replace(':', '_');
    }

    public String toLanguageKey() {
        return this.namespace + "." + this.path;
    }

    public String toShortLanguageKey() {
        return this.namespace.equals("minecraft") ? this.path : this.toLanguageKey();
    }

    public String toShortString() {
        return this.namespace.equals("minecraft") ? this.path : this.toString();
    }

    public String toLanguageKey(String p_469124_) {
        return p_469124_ + "." + this.toLanguageKey();
    }

    public String toLanguageKey(String p_468901_, String p_468032_) {
        return p_468901_ + "." + this.toLanguageKey() + "." + p_468032_;
    }

    private static String readGreedy(StringReader p_467672_) {
        int i = p_467672_.getCursor();

        while (p_467672_.canRead() && isAllowedInIdentifier(p_467672_.peek())) {
            p_467672_.skip();
        }

        return p_467672_.getString().substring(i, p_467672_.getCursor());
    }

    public static Identifier read(StringReader p_467274_) throws CommandSyntaxException {
        int i = p_467274_.getCursor();
        String s = readGreedy(p_467274_);

        try {
            return parse(s);
        } catch (IdentifierException identifierexception) {
            p_467274_.setCursor(i);
            throw ERROR_INVALID.createWithContext(p_467274_);
        }
    }

    public static Identifier readNonEmpty(StringReader p_469565_) throws CommandSyntaxException {
        int i = p_469565_.getCursor();
        String s = readGreedy(p_469565_);
        if (s.isEmpty()) {
            throw ERROR_INVALID.createWithContext(p_469565_);
        } else {
            try {
                return parse(s);
            } catch (IdentifierException identifierexception) {
                p_469565_.setCursor(i);
                throw ERROR_INVALID.createWithContext(p_469565_);
            }
        }
    }

    public static boolean isAllowedInIdentifier(char p_467415_) {
        return p_467415_ >= '0' && p_467415_ <= '9'
            || p_467415_ >= 'a' && p_467415_ <= 'z'
            || p_467415_ == '_'
            || p_467415_ == ':'
            || p_467415_ == '/'
            || p_467415_ == '.'
            || p_467415_ == '-';
    }

    public static boolean isValidPath(String p_468292_) {
        for (int i = 0; i < p_468292_.length(); i++) {
            if (!validPathChar(p_468292_.charAt(i))) {
                return false;
            }
        }

        return true;
    }

    public static boolean isValidNamespace(String p_468401_) {
        for (int i = 0; i < p_468401_.length(); i++) {
            if (!validNamespaceChar(p_468401_.charAt(i))) {
                return false;
            }
        }

        return true;
    }

    private static String assertValidNamespace(String p_468570_, String p_467647_) {
        if (!isValidNamespace(p_468570_)) {
            throw new IdentifierException("Non [a-z0-9_.-] character in namespace of location: " + p_468570_ + ":" + p_467647_);
        } else {
            return p_468570_;
        }
    }

    public static boolean validPathChar(char p_467163_) {
        return p_467163_ == '_'
            || p_467163_ == '-'
            || p_467163_ >= 'a' && p_467163_ <= 'z'
            || p_467163_ >= '0' && p_467163_ <= '9'
            || p_467163_ == '/'
            || p_467163_ == '.';
    }

    public static boolean validNamespaceChar(char p_467176_) {
        return p_467176_ == '_' || p_467176_ == '-' || p_467176_ >= 'a' && p_467176_ <= 'z' || p_467176_ >= '0' && p_467176_ <= '9' || p_467176_ == '.';
    }

    private static String assertValidPath(String p_467961_, String p_469337_) {
        if (!isValidPath(p_469337_)) {
            throw new IdentifierException("Non [a-z0-9/._-] character in path of location: " + p_467961_ + ":" + p_469337_);
        } else {
            return p_469337_;
        }
    }
}
