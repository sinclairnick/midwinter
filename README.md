# Midwinter.js

Midwinter.js is a powerful, experimental middleware engine which allows middleware to define imperative code, metadata and type information, enabling a much smarter plugin system.

It is specifically built for WinterCG runtimes, hence the name.

```sh
npm i midwinter
```

## Overview

Most middleware is purely _imperative_. To understand what middleware does, we must either manually trace the code, or actually run the code itself.

Midwinter enables middleware to _declare_ it's effects via _metadata_ (for static information) and _types_ (for how the request context changes over time).

This simple – but very powerful – paradigm means plugins (like [routing](#routing), [validation](#validation)) can truly extend upon the simple core of Midwinter, as opposed to merely hacking atop it like traditional middleware.

## Basic Usage

```ts
const mid = new Midwinter();

const handler = mid
  .use((req, ctx) => {
    return { userId: "123" }; // Update the request context
  })

  .end((req, ctx) => {
    // .end middleware pipeline
    return Response.json({ userId: ctx.userId });
  });

const response = await handler(new Request(opts));
//    ^?
//    (req: Request) => Promise<Response>
```

## Table of Contents

1. [Introduction](#introduction)
2. [Plugins](#plugins)

   2.1. [Official Plugins](#official-plugins)

   ..2.1.1. [Validation](#validation)

   ..2.1.2. [Routing](#routing)

3. [API Reference](#api-reference)
   - [`.define()`](#definemiddleware)
   - [`.use()`](#usemiddleware)
   - [`.end()`](#endmiddleware)

## Introduction

### How does Midwinter work?

Midwinter is a middleware engine which creates pipelines of middleware. This enables building fully-fledged backend apps in any modern runtime environment.

With Midwinter, everything is middleware and all middleware can optionally provide clues about how it modifies our application.

For changes that occur during the request lifecycle, middleware can inform us how it might change the **request context**. For changes to the application as a whole, **metadata** can be specified.

Any given middleware can provide any number of:

- Request/response handling
- Request context updates
- Metadata updates

Downstream middleware can utilise the updated request context. Plugins can utilise metadata to extend functionality. Both occur with full type-safety, enabling both programmatic and type-level introspection and processing.

In turn, framework-level functionality can be provided as a meagre plugin.

### Key Concepts

<details>
<summary>
<b>Request Context</b>
</summary>

The request context represents how our app changes over the lifetime of a request. Using Midwinter, the changes to this context are automatically inferred, and can be explicitly defined if necessary.

> _e.g. etermining the current user and adding to the request context_

</details>

<details>
<summary>
<b>Metadata</b>
</summary>

Middleware can also register information that doesn't depend on the request lifecycle, in the form of metadata. For example, a given middleware could provide metadata about OpenAPI validation schema, to trivially enable client-side types.

> _e.g specifying the path, method or validation schema for a request handler, for later use with a routing or validation plugin._

</details>

## Middleware Guide

Midwinter intentionally aims for a minimal, unopinionated API surface. As such, middleware are regular basic functions built on WinterCG web standards.

```ts
const isAuthed = (req: Request) => {
  if (getUser() == null) {
    return Response.json({ code: "UNAUTHORISED" }, { status: 401 });
  }
}; // optionally: `satisfies Middleware`
```

This can then be used to create a basic middleware pipeline.

```ts
const handleRequest = new Midwinter()
  .use(isAuthed) // Using our simple function
  .end((req, ctx) => {
    return Response.json({ ok: true });
  });
```

To avoid having to explicitly define the parameter types, we should use the `.use` and `.define` methods instead.

```ts
const mid = new Midwinter();

const isAuthed = mid.define((req, ctx, meta) => {
  if (getUser() == null) {
    return Response.json({ code: "UNAUTHORISED" }, { status: 401 });
  }
});
```

From here on we'll use these.

### Return value behaviour

<details>
<summary>Expand</summary>

Middleware often needs to update the request context,return early responses and observe/modify outbound responses. Midwinter achieves this using a functional style, relying on the value returned by a middleware function.

|              |                                                                              |
| ------------ | ---------------------------------------------------------------------------- |
| **Object**   | Update request context (shallowly)                                           |
| **Function** | Registers a "response listener" (outbound middleware)                        |
| **Response** | Return the response, passing through any response listeners defined upstream |

> Note that response listeners are executed in _reverse_ or "inside-out" order

On top of being convenient and simple, relying on return type maintains type-safety across our middleware pipeline by simply inferring what request context updates our middleware makes. In turn, we can avoid entire classes of errors and work, knowing what data does (not) exist at a given point.

These three options look something like:

```ts
mid.define(() => {
  if (withUpdate) {
    return { foo: "bar" };
  }

  if (withResponse) {
    return Response.json({ early: true });
  }

  return (res: Response) => {
    // Optionally return a modified response
    return new Response(res.body, { status: 301 });
  };
});
```

</details>

### Request Context

<details>
<summary>Expand</summary>

The second argument Midwinter passes to any middleware is the request context. By default, the middleware instance we're extending from will populate the `ctx` type, but we can also override this.

```ts
const ipLogger = mid.define((req, ctx: { ip: boolean }) => {
  // Ctx type has been override here
  console.log(ctx.ip);
});
```

If we try to `.use` this middleware somewhere `ip` is _not_ yet part of the context, we will get a typescript error.

> The third parameter is the middleware meta, which cannot be mutated.

#### Updating the request context

##### Via return value

We can return a simple JavaScript object to indicate a context update.

```ts
const withReqTime = mid.define((req, ctx) => {
  return { start: new Date() };
});

new Midwinter()
  .use(withReqTime) //
  .use((req, ctx) => {
    // Access updated context
    ctx.start instanceof Date; // true
  });
```

#### Via mutation

Much of the time, we only need to return one of the above three return value possibilities: object, function or response.

While returning both a response and response listener is redundant, we may still want to _update the request_ context during these two cases. To do so, we can mutate the request context directly.

```ts
const withReqTime = mid.define<{ start: number }>((req, ctx) => {
  const start = Date.now()

  // Update context
	ctx.start = start


	// Returning a response listener
  return () => {
    const end = Date.now()

		console.log("Took" start - end)
  };
});
```

In this example, the type has been explicitly provided, which maintains type-safety. However, this is entirely optional.

</details>

### Listening to responses

<details>
<summary>Expand</summary>

Returning a function enables listening to and modifying the outbound response. The function takes a single argument: the response object.

```ts
mid.define(() => {
  return (res: Response) => {
    // TODO: Return a new response... or not
  };
});
```

We can modify the response object by returning a new one. Bear in mind both `Request` and `Response`, as per the WinterCG standard, are _immutable_, so you should make use of the [`.clone()`](https://developer.mozilla.org/en-US/docs/Web/API/Response/clone) method when applicable.

</details>

### Chaining

<details>
<summary>Expand</summary>

Midwinter makes heavy use of chaining and TypeScript inference which helps to compose complex middleware pipelines using simple code, and to string our applications together at the type-level to surface issues before running anything, like trying to access missing data from the request context.

```ts
const adminRoute = mid
  .use(withAuth) // 1
  .use(isAdmin); // 2

const superAdminRoute = isAdminMid // Reuse this pipeline
  .use(hasEmailDomain("@test.com")); // 3
```

By chaining we can extend middleware pipelines easily and create complex pathways for a request to travel through.

> Each time we chain middleware a _new instance_ is returned, meaning each pipeline is independent and changing one will not change any others.

</details>

### Ending a pipeline: returning a response

<details>
<summary>Expand</summary>

To officially _end_ a middleware pipeline, and thus return a request handler we can run, we use the `.end` method. This is is similar to `.use`, but _must_ return a `Response` object.

Instead of a new `Midwinter` instance being returned, `.end` results in a request handler function that accepts a `Request` and returns a `Response` promise.

```ts
const handle = mid
  .use(withA)
  .use(withB)
  .use(withC)
  .end((req, ctx, meta) => {
    return Response.json({ ok: true });
  });

// Invoke the handler like:
const response = await handle(request);
```

</details>

### Metadata

Metadata enables middleware to "decorate" our backend apps in powerful ways that traditional middleware can't.

To define middleware metadata, we can use the `.define` method, passing a second argument.

```ts
const withName = (name: string) => {
  const meta = { name };

  return mid.define(
    () => {},
    // Pass any meta here
    meta // <--
  );
};
```

If we use this middeware, our resulting request handler will possess this metadata.

```ts
const handle = mid
  .use(withName("getUser")) // <--
  .end(() => {
    // ...
  });

handle.meta.name === "getUser
```

This approach to metadata enables plugins, or own code, to fully "see" our app, both programmatically and type-wise. This feature enables a very simple and powerful paradigm for plugins.

#### Metadata merging

Like request context, metadata is shallowly merged,

## Plugins

In Midwinter, "plugins" (as opposed to regular middleware), broadly refers to a set of interacting middleware or functionality that operates on request handlers.

For example, a plugin might add some metadata to a middleware pipeline and then access that metadata elsewhere, down the line.

Below are some examples.

### Official Plugins

Midwinter is both simple and powerful. Therefore, core backend functionality (like routing) is able to be provided as a plugin, without any concessions.

Midwinter provides several official plugins, but even these core parts can be swapped for any third-party or custom approaches one might prefer more.

> More official plugins will be added in coming months. Feel free to open a PR for any requests.

### Routing

<details>
<summary>Expand</summary>

Routing is central to any backend app. However, with the advent of full-stack frameworks and file-system routing, not all apps _need_ an explicit router.

For those who do, this plugin enables a flexible routing solution.

In short, the routing plugin turns a list of request handlers into an actual "app".

#### Setup

```ts
import * as Routing from "midwinter/routing";

export const { router, routing } = Routing.init(opts);
```

#### `routing`

The `routing` function is a middleware that adds routing-related metadata to a route.

```ts
const handle = mid
  .use(
    routing({
      path: "/user",
      method: "/get",
    })
  )
  .end(() => {});
```

We can optionally specify a prefix which will continue along any subsequent middleware pipelines.

```ts
const apiRoute = mid.use(
  routing({
    prefix: "/api/v1",
  })
);

const getPost = apiRoute
	.use(routing({
		path: "/post/:id",
		method: "get
	}))
	.end(() => {
		// ...
	})
```

#### `router`

To actually instantiate our app router, we use the `router` function.

```ts
const app = router([getPost, ...others], opts);

// Call app router on new request:
const response = await app(request);
```

</details>

### Validation

<details>
<summary>Expand</summary>

Input and output validation is table stakes for any serious backend app. While we can always imperatively validate data, the validation plugin enables a declarative API that is more concise.

By virtue of being declarative, the validation plugin also facilitates opportunities for easily inferring types or generating specs like OpenAPI.

The validation plugin works with most popular schema validation libraries out of the box. The below examples are using `zod`.

#### Setup

```ts
import * as Validation from "midwinter/validation";

export const { valid, validLazy, output } = Validation.init(opts);
```

#### `valid`

The `valid` function enables validating various input and outputs of your backend.

```ts
const Schema = z.object({
  // ...
});

mid
  .use(
    valid({
      // All possible fields:
      Query: Schema,
      Params: Schema,
      Headers: Schema,
      Body: Schema,
      Output: Schema,
    })
  )
  .end((req, ctx) => {
    const { query, params, headers, body } = ctx;
  });
```

With `valid`, all components are pre-parsed and added to the context.

> Note that `Output` _does not_ parse the response.body. See below.

#### `validLazy`

In contrast to `valid`, `validLazy` does not pre-parse anything. Instead a parsing function is added to the context, offering greater flexibility over how parsing is handled and what to parse.

```ts
mid
  .use(
    validLazy({
      // ...same options
    })
  )
  .end(async (req, ctx) => {
    const { parse } = ctx;

    // Parse a single part
    const query = await parse("query");

    // or parse all parts
    const { query, params, body, headers } = await parse();
  });
```

#### `output`

At a minimum, the `output` function allows us to return a value, which will then get packaged into a JSON response.

If we've specified an `Output` schema, our return value will be validated against this.

```ts
mid
  .use(
    valid({
      Output: z.object({ foo: z.string() }), // <-- Optionally specify output schema here
    })
  )
  .end(
    output((req, ctx) => {
      return { foo: "bar" }; // <-- Will be parsed and returned as a JSON Response
    })
  );
```

</details>

## API Reference

The API surface is intentionally very concise, comprised of only _three_ methods.

### `.define(middleware)`

> Define a reusable middleware

**Define a simple auth middleware**

```ts
const mid = new Midwinter();

const withAuth = mid.define((req, ctx) => {
  if (isAuthed) {
    return { user: { id: "123" } }; // Return ctx updates
  }

  // Early return with a response
  return Response.json({ error: true });
});
```

**Manually specify the context updates type**

```ts
const withMutation = mid.define<{ wasMutated: boolean }>((req, ctx) => {
  ctx.wasMutated = true;
});
```

**Chaining middleware**

```ts
const withAuthAndMutation = withAuth.use(withMutation);
```

### `.use(middleware)`

> Register a middleware to a middleware pipeline

**Use predefined middleware**

```ts
const getPostMid = mid.use(withAuth).end((req, ctx) => {
  ctx.user; // defined
});
```

**Use inline middleware**

```ts
const getPost = mid
  .use((req, ctx) => {
    return { user };
  })
  .end((req, ctx) => {
    ctx.user; // defined
  });
```

**Inline middleware with mutations**

```ts
  .use<{ wasMutated: boolean }>((req, ctx) => {
    ctx.wasMutated = true;
  });
```

### `.end(middleware)`

> Use a middleware that must return a response

```ts
// Respond to the request and terminate the `.use` chain
const getPost = mid
  // ...snip
  .end((req, ctx) => {
    return new Response();
  });

// Use the request handler however you want
const response = await getPost(new Request(url));
```
