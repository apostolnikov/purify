import { Show } from '../typeclasses/Show'
import { Setoid } from '../typeclasses/Setoid'
import { Ord } from '../typeclasses/Ord'
import { Semigroup } from '../typeclasses/Semigroup'
import { Functor } from '../typeclasses/Functor'
import { Apply } from '../typeclasses/Apply'
import { Applicative } from '../typeclasses/Applicative'
import { Alt } from '../typeclasses/Alt'
import { Chain } from '../typeclasses/Chain'
import { Monad } from '../typeclasses/Monad'
import { Foldable } from '../typeclasses/Foldable'
import { Extend } from '../typeclasses/Extend'
import { Bifunctor } from '../typeclasses/Bifunctor'
import { Unsafe } from '../typeclasses/Unsafe'

import { Maybe, Just, Nothing } from './Maybe'

const _left: string = 'Left'
const _right: string = 'Right'

export type Left<L, R> = Either<L, R>
export type Right<L, R> = Either<L, R>
export type EitherPatterns<L, R, T> = { Left: (l: L) => T, Right: (r: R) => T } | {_: () => T}

export class Either<L, R> implements Show, Setoid<Either<L, R>>, Functor<R>, Apply<R>, Applicative<R>, Alt<L | R>, Chain<R>, Monad<R>, Foldable<L | R>, Extend<L | R>, Bifunctor<L, R>, Unsafe {
    constructor(private readonly value: L | R, private readonly tag: string) {}

    readonly of = Either.of
    readonly 'fantasy-land/alt' = this.alt
    readonly 'fantasy-land/of' = this.of
    readonly 'fantasy-land/ap' = this.ap
    readonly 'fantasy-land/chain' = this.chain
    readonly 'fantasy-land/reduce' = this.reduce
    readonly 'fantasy-land/map' = this.map
    readonly 'fantasy-land/extend' = this.extend
    readonly 'fantasy-land/equals' = this.equals
    readonly 'fantasy-land/bimap' = this.bimap

    private asLeft(): Left<L, never> {
        return this as any as Left<L, never>
    }

    private asRight(): Right<never, R> {
        return this as any as Right<never, R>
    }

    private isLeft_(): boolean {
        return this.isLeft()
    }

    private isRight_(): boolean {
        return this.isRight()
    }

    /** Takes a value and wraps it in a `Right` */
    static of<R, L = never>(value: R): Right<L, R> {
        return Right(value)
    }

    /** Takes a list of eithers and returns a list of all `Left` values */
    static lefts<L, R>(list: Either<L,R>[]): L[] {
        return list.filter(x => x.isLeft()).map(x => x.asLeft().value)
    }

    /** Takes a list of eithers and returns a list of all `Right` values */
    static rights<L, R>(list: Either<L, R>[]): R[] {
        return list.filter(x => x.isRight()).map(x => x.asRight().value)
    }

    /** Calls a function and returns a `Right` with the return value or an exception wrapped in a `Left` in case of failure */
    static encase<L extends Error, R>(throwsF: () => R): Either<L, R> {
        try {
            return Right(throwsF())
        } catch(e) {
            return Left(e)
        }
    }

    /** Returns true if `this` is `Left`, otherwise it returns false */
    isLeft(): this is Left<L, never> {
        return this.tag === _left
    }

    /** Returns true if `this` is `Right`, otherwise it returns false */
    isRight(): this is Right<never, R> {
        return this.tag === _right
    }

    toJSON(): L | R {
        return this.value
    }

    inspect(): string {
        return `${this.tag}(${JSON.stringify(this.value)})`
    }

    toString(): string {
        return this.inspect()
    }

    /** Given two functions, maps the value inside `this` using the first if `this` is `Left` or using the second one if `this` is `Right`.
     * If both functions return the same type consider using `Either#either` instead
     */
    bimap<L2, R2>(f: (value: L) => L2, g: (value: R) => R2): Either<L2, R2> {
        return this.isLeft_() ? Left(f(this.asLeft().value)) : Right(g(this.asRight().value))
    }

    /** Maps the `Right` value of `this`, acts like an identity if `this` is `Left` */
    map<R2>(f: (value: R) => R2): Either<L, R2> {
        return this.bimap(x => x, f)
    }

    /** Maps the `Left` value of `this`, acts like an identity if `this` is `Right` */
    mapLeft<L2>(f: (value: L) => L2): Either<L2, R> {
        return this.bimap(f, x => x)
    }

    /** Applies a `Right` function over a `Right` value. Returns `Left` if either `this` or the function are `Left` */
    ap<R2>(other: Either<L, (value: R) => R2>): Either<L, R2> {
        return other.isLeft_() ? other.asLeft() : this.map(other.asRight().value)
    }

    /** Compares `this` to another `Either`, returns false if the constructors or the values inside are different, e.g. `Right(5).equals(Left(5))` is false */
    equals(other: Either<L, R>): boolean {
        if (this.isLeft_() && other.isLeft_()) {
            return this.value === other.value
        }

        if (this.isRight_() && other.isRight_()) {
            return this.value === other.value
        }

        return false
    }

    /** Transforms `this` with a function that returns an `Either`. Useful for chaining many computations that may fail */
    chain<R2>(f: (value: R) => Either<L, R2>): Either<L, R2> {
        return this.isLeft_() ? this.asLeft() : f(this.asRight().value)
    }

    /** Flattens nested Eithers. `e.join()` is equivalent to `e.chain(x => x)` */
    join<R2>(this: Either<L, Either<L, R2>>): Either<L, R2> {
        return this.chain(x => x)
    }

    /** Returns the first `Right` between `this` and another `Either` or the `Left` in the argument if both `this` and the argument are `Left` */
    alt(other: Either<L, R>): Either<L, R> {
        return this.isRight_() ? this : other
    }

    /** Takes a reducer and a initial value and returns the initial value if `this` is `Left` or the result of applying the function to the initial value and the value inside `this` */
    reduce<T>(reducer: (accumulator: T, value: R) => T, initialValue: T): T {
        return this.isLeft_() ? initialValue : reducer(initialValue, this.asRight().value)
    }

    /** Returns `this` if it\'s a `Left`, otherwise it returns the result of applying the function argument to `this` and wrapping it in a `Right` */
    extend<R2>(f: (value: Either<L, R>) => R2): Either<L, R2> {
        return this.isLeft_() ? this.asLeft() : Right(f(this))
    }

    /** Returns the value inside `this` or throws an error if `this` is a `Left` */
    unsafeCoerce(): R {
        return this.isLeft_() ? (() => { throw new Error('Either got coerced to a Left') })() : this.asRight().value;
    }

    /** Structural pattern matching for `Either` in the form of a function */
    caseOf<T>(patterns: EitherPatterns<L, R, T>): T {
        if ('_' in patterns) {
            return patterns._()
        } else {
            return this.isLeft_() ? patterns.Left(this.asLeft().value) : patterns.Right(this.asRight().value)
        }
    }

    /** Returns the value inside `this` if it\'s `Left` or a default value if `this` is `Right` */
    leftOrDefault(defaultValue: L): L {
        return this.isLeft_() ? this.asLeft().value : defaultValue
    }

    /** Returns the value inside `this` if it\'s `Right` or a default value if `this` is `Left` */
    orDefault(defaultValue: R): R {
        return this.isRight_() ? this.asRight().value : defaultValue
    }

    /** Lazy version of `orDefault`. Takes a function that returns the default value, that function will be called only if `this` is `Left` */
    orDefaultLazy(getDefaultValue: () => R): R {
        return this.isRight_() ? this.asRight().value : getDefaultValue()
    }
    
    /** Lazy version of `leftOrDefault`. Takes a function that returns the default value, that function will be called only if `this` is `Right` */
    leftOrDefaultLazy(getDefaultValue: () => L): L {
        return this.isLeft_() ? this.asLeft().value : getDefaultValue()
    }

    /** Runs an effect if `this` is `Left`, returns `this` to make chaining other methods possible */
    ifLeft(effect: (value: L) => any): this {
        return this.isLeft_() ? (effect(this.asLeft().value), this) : this
    }

    /** Runs an effect if `this` is `Right`, returns `this` to make chaining other methods possible */
    ifRight(effect: (value: R) => any): this {
        return this.isLeft_() ? this : (effect(this.asRight().value), this)
    }

    /** Constructs a `Just` with the value of `this` if it\'s `Right` or a `Nothing` if `this` is `Left` */
    toMaybe(): Maybe<R> {
        return this.isLeft_() ? Nothing : Just(this.asRight().value)
    }

    /** Constructs a `Just` with the value of `this` if it\'s `Left` or a `Nothing` if `this` is `Right` */
    leftToMaybe(): Maybe<L> {
        return this.isLeft_() ? Just(this.asLeft().value) : Nothing
    }

    /** Given two map functions, maps using the first if `this` is `Left` or using the second one if `this` is `Right`. If you want the functions to return different types depending on the either you may want to use `Either#bimap` instead */
    either<T>(ifLeft: (value: L) => T, ifRight: (value: R) => T): T {
        return this.isLeft_() ? ifLeft(this.asLeft().value) : ifRight(this.asRight().value)
    }

    /** Extracts the value out of `this` */
    extract(): L | R {
        return this.value
    }
}

/** Constructs a Left. Most commonly represents information about an operation that failed */
export const Left = <L, R = never>(value: L): Left<L, R> =>
    new Either(value, _left)

/** Constructs a Right. Represents a successful result of an operation */
export const Right = <R, L = never>(value: R): Right<L, R> =>
    new Either(value, _right)
