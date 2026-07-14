/**
 * TypeScript representation of `mac_osx_new/KeyboardLayout.dtd` for use with
 * `fast-xml-builder` configured with `attributesGroupName: "attributes"` and
 * `commentPropName: "comment"`.
 *
 * Attribute descriptions and value constraints are taken from Apple Technical
 * Note TN2056 "Installable Keyboard Layouts".
 *
 * Attributes are grouped under an `attributes` subobject instead of being
 * prefixed with `@_`. An object of type `KeyboardLayoutDocument` can be passed
 * directly to `XMLBuilder.build(...)` to produce a keylayout XML document that
 * conforms to the DTD.
 */

/** Helper for DTD occurrences `+` (one or more). */
export type OneOrMore<T> = readonly [T, ...T[]];

/** Optional XML comment that `fast-xml-builder` renders as `<!-- ... -->`. */
type Comment = { readonly comment: string | [{ "#text": string }] };

/**
 * A modifier key that has a ‘left’, a ‘right’ and an ‘any’ variant. E.g. `shift`, `rightShift`, `anyShift`.
 */
type LeftRightAny<Key extends string> = {
  left: Key;
  right: `right${Capitalize<Key>}`;
  any: `any${Capitalize<Key>}`;
};
type ModKey = LeftRightAny<string> | string;

type RequiredOrIrrelevantOrMissing<Key extends ModKey> = Key extends string
  ? [Key] | [`${Key}?`] | []
  : Key extends LeftRightAny<string>
    ? | AllModifierCombinations<[Key["left"], Key["right"]]>
      | RequiredOrIrrelevantOrMissing<Key["any"]>
    : never;

type AllModifierCombinations<Options extends ModKey[]> = Options extends [
  infer First extends ModKey,
  ...infer Rest extends ModKey[],
]
  ? [...RequiredOrIrrelevantOrMissing<First>, ...AllModifierCombinations<Rest>]
  : [];

type SpaceJoined<Options extends string[]> = Options extends [
  infer Last extends string,
]
  ? Last
  : Options extends [infer First extends string, ...infer Rest extends string[]]
    ? `${First} ${SpaceJoined<Rest>}`
    : "";

/**
 * Whitespace-separated list of modifier key specifications.
 * The empty string means "no modifier keys are down".
 * A word means the modifier must be pressed, absence means it must not be
 * pressed, and a trailing `?` means the state is irrelevant.
 */
type ModifierSpec = SpaceJoined<
  AllModifierCombinations<
    [
      LeftRightAny<"shift">,
      LeftRightAny<"option">,
      LeftRightAny<"control">,
      "command",
      "caps",
    ]
  >
>;

/**
 * Enforces that `baseMapSet` and `baseIndex` are either both present or both
 * absent, as required by the DTD.
 */
type KeyMapBaseAttributes =
  | { readonly baseMapSet: string; readonly baseIndex: string }
  | { readonly baseMapSet?: undefined; readonly baseIndex?: undefined };

/** The root `<keyboard>` element. */
export type KeyboardLayout = {
  readonly attributes: {
    /**
     * The section of the keyboard menu in which this layout should appear.
     * This is the script code. Unicode keyboards should use group `126`.
     * Supported script codes are Roman (0), Japanese (1), Traditional Chinese
     * (2), Korean (3), Cyrillic (7), Simplified Chinese (25), and Central
     * European (29).
     */
    readonly group: string;
    /**
     * The unique ID for the keyboard. This is numeric and must match the
     * script bundle specified in `group`. Unicode keyboards use negative IDs.
     * If this ID collides with another keyboard, the system will assign a new
     * one.
     */
    readonly id: string;
    /**
     * The name of the keyboard as it appears in the Keyboard Menu. This name
     * cannot be localized via the XML file (use a bundle for localization).
     */
    readonly name: string;
    /**
     * The maximum number of UTF-16 values that can be generated from a single
     * keypress.
     */
    readonly maxout?: string;
  };
  /** `<layouts>+` */
  readonly layouts: OneOrMore<Layouts>;
  /** `<modifierMap>+` */
  readonly modifierMap: OneOrMore<ModifierMap>;
  /** `<keyMapSet>+` */
  readonly keyMapSet: OneOrMore<KeyMapSet>;
  /** `<actions>*` */
  readonly actions?: Actions;
  /** `<terminators>*` */
  readonly terminators?: Terminators;
} & Partial<Comment>;

/** Top-level wrapper passed to `XMLBuilder.build`. */
export type KeyboardLayoutDocument = {
  readonly keyboard: KeyboardLayout;
} & Partial<Comment>;

/** `<layouts>` — container for one or more `<layout>` entries. */
export type Layouts = {
  readonly layout: OneOrMore<Layout>;
} & Partial<Comment>;

/** `<layout>` — EMPTY. */
export type Layout = {
  readonly attributes: {
    /** The hardware ID of the first keyboard type controlled by this element. */
    readonly first: string;
    /** The hardware ID of the last keyboard type controlled by this element. */
    readonly last: string;
    /** Identifier of the `<modifierMap>` to use for this hardware ID range. */
    readonly modifiers: string;
    /** Identifier of the `<keyMapSet>` to use for this hardware ID range. */
    readonly mapSet: string;
  };
} & Partial<Comment>;

/** `<modifierMap>` — container for one or more `<keyMapSelect>` entries. */
export type ModifierMap = {
  readonly attributes: {
    /**
     * Arbitrary string identifying this `<modifierMap>`. Must be unique across
     * all `<modifierMap>` elements in the document.
     */
    readonly id: string;
    /**
     * The table number to use for modifier key combinations that are not
     * explicitly specified by any `<modifier>` element within this map.
     */
    readonly defaultIndex: string;
  };
  readonly keyMapSelect: OneOrMore<KeyMapSelect>;
} & Partial<Comment>;

/** `<keyMapSelect>` — container for one or more `<modifier>` entries. */
export type KeyMapSelect = {
  readonly attributes: {
    /**
     * Table number, starting from 0, to which the modifier key combinations
     * specified by the contained `<modifier>` elements should be mapped.
     */
    readonly mapIndex: string;
  };
  readonly modifier: OneOrMore<Modifier>;
} & Partial<Comment>;

/** `<modifier>` — EMPTY. */
export type Modifier = {
  readonly attributes: {
    /**
     * Whitespace-separated list of modifier key combinations. A word means the
     * modifier must be pressed, absence means it must not be pressed, and a
     * trailing `?` means the state is irrelevant.
     */
    readonly keys: ModifierSpec;
  };
} & Partial<Comment>;

/** `<keyMapSet>` — container for one or more `<keyMap>` entries. */
export type KeyMapSet = {
  readonly attributes: {
    /**
     * Identifier for this `<keyMapSet>`. Must be unique across all
     * `<keyMapSet>` elements in the document.
     */
    readonly id: string;
  };
  readonly keyMap: OneOrMore<KeyMap>;
} & Partial<Comment>;

/** `<keyMap>` — container for one or more `<key>` entries. */
export type KeyMap = {
  readonly attributes: {
    /**
     * The table number. This is referenced from the `<keyMapSelect>` element.
     */
    readonly index: string;
  } & KeyMapBaseAttributes;
  readonly key: readonly (Key | Comment)[];
} & Partial<Comment>;

/** `<key>` — may contain zero or more inline `<action>` children. */
export type Key = {
  readonly attributes: {
    /**
     * The decimal virtual key code that this element maps. Must be unique
     * across all `<key>` elements within a particular `<keyMap>`.
     */
    readonly code: string;
    /**
     * String of UTF-16 values to output unconditionally when this virtual key
     * is received.
     */
    readonly output?: string;
    /**
     * Identifier of a named `<action>` (from the `<actions>` element) to
     * execute when this virtual key is received.
     */
    readonly action?: string;
  };
  /** `<action>*` inline anonymous actions. */
  readonly action?: readonly AnonymousAction[];
} & Partial<Comment>;

/** `<actions>` — container for one or more named `<action>` entries. */
export type Actions = {
  readonly action: OneOrMore<NamedAction>;
} & Partial<Comment>;

/** Common shape shared by named and anonymous `<action>` elements. */
type ActionBase = {
  readonly when: OneOrMore<When>;
} & Partial<Comment>;

/**
 * `<action>` used inside `<actions>`. It must have an `id` so that `<key>`
 * elements can reference it by name.
 */
export type NamedAction = ActionBase & {
  readonly attributes: {
    /** Arbitrary string identifying this action. Must be unique. */
    readonly id: string;
  };
};

/**
 * `<action>` used inline as a child of `<key>`. It must not have an `id`
 * attribute.
 */
export type AnonymousAction = ActionBase;

/** `<when>` inside an `<action>` — EMPTY. */
export type When = {
  readonly attributes: {
    /**
     * The state the state machine must be in for this element to apply. May be
     * an arbitrary string, a decimal number, or the special string `"none"`
     * indicating the base (initial) state. A `<when>` with state `"none"` must
     * be the first in its enclosing `<action>`.
     */
    readonly state: string;
    /**
     * If present, this `<when>` specifies a range of states and `state` is the
     * beginning of that range (a decimal number).
     */
    readonly through?: string;
    /**
     * String to emit. For single-state actions one of `output` or `next` must
     * be present. If a range is specified, this must be a single UTF-16 code
     * point.
     */
    readonly output?: string;
    /**
     * Decimal number between 1 and 255. Only valid when `through` is present.
     * The difference between the input state and the start of the range is
     * multiplied by this number, then added to the `next` state and/or the
     * output UTF-16 value.
     */
    readonly multiplier?: string;
    /**
     * Next state to enter. Defaults to `"none"` (the base state). Must not be
     * specified inside `<terminators>`.
     */
    readonly next?: string;
  };
} & Partial<Comment>;

/** `<terminators>` — container for one or more `<when>` entries. */
export type Terminators = {
  readonly when: OneOrMore<TerminatorWhen>;
} & Partial<Comment>;

/**
 * `<when>` inside `<terminators>`. Terminators specify what to do when no
 * action matches the current state; they may only specify a single state and
 * an output string.
 */
export type TerminatorWhen = {
  readonly attributes: {
    /**
     * The state the state machine must be in for this terminator to apply. May
     * be an arbitrary string, a decimal number, or `"none"`.
     */
    readonly state: string;
    /** String to emit. Defaults to no output. */
    readonly output?: string;
  };
} & Partial<Comment>;
