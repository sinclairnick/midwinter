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

const withAuth = mid.define(
  (req, ctx) => {
    // Partially update the request context
    return { userId: "123" };
  },
  { isAuthed: true } // Optionally provide meta
);

const handler = mid.use(withAuth).end((req, ctx) => {
  return Response.json({ userId: ctx.userId });
});

handler.meta.isAuthed;
// true

const response = await handler(new Request(opts));
// Handler is a standard request handler
// (req: Request) => Promise<Response>
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

With Midwinter, everything is middleware and all middleware can optionally provide clues about how it modifies our application. For changes that occur during a request, middleware can inform us how it might change the **request context**. For changes to the application as a whole, we can store **metadata**, which can later be used by other tooling.

With middleware providing an implementation, type information and static metadata, our app becomes much smarter and more flexible.

| Concept             | Description                                                                                                                                                                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Request Context** | The request context represents how our app changes over the lifetime of a request. Using Midwinter, the changes to this context are automatically inferred, and can be explicitly defined if necessary.                                                                                                 |
| **Metadata**        | Middleware can also register information that doesn't depend on the request lifecycle, in the form of metadata. For example, a given middleware could provide metadata about OpenAPI validation schema, to trivially enable client-side types.                                                          |
| **Chaining**        | Midwinter makes heavy use of chaining and TypeScript inference which helps to compose complex middleware pipelines using simple code, and to string our applications together at the type-level to surface issues before running anything, like trying to access missing data from the request context. |

## Plugins

Plugins are merely some combination of middleware and/or functionality which operates on a middleware chain.

> For example, an OpenAPI plugin might add metadata via middleware and then "read" the app's routes to construct an OpenAPI spec.

The source code for the official plugins may be a good place to look to get started.

### Official Plugins

The core of Midwinter is incredibly simple and straightforward, and so most functionality one might expect is actually implemented in plugins.

Below are the official plugins, which could just as easily be replaced by third-party alternatives.

### Validation

### Routing

## API Reference

The API surface is intentionally very concise, comprised of only _three_ methods.

**.define(middleware)**

> Define a reusable middleware

```ts
const mid = new Midwinter();

// Define a simple auth middleware
const withAuth = mid.define((req, ctx) => {
  if (isAuthed) {
    return { user: { id: "123" } }; // Return ctx updates
  }

  // Early return with a response
  return Response.json({ error: true });
});

// Manually specify the context updates type
const withMutation = mid.define<{ wasMutated: boolean }>((req, ctx) => {
  ctx.wasMutated = true;
});

// Reuse chained middleware
const withAuthAndMutation = withAuth.use(withMutation);
```

**.use(middleware)**

> Use a predefined or inline middleware

```ts
const getPostMid = mid
  .use(withAuth) // Use predefined middleware here

  // Or do it inline
  .use((req, ctx) => {
    return { userId: user.id };
  })

  // Or mutate the ctx, retaining type-safety
  .use<{ wasMutated: boolean }>((req, ctx) => {
    ctx.wasMutated = true;
  });
```

**.end(middleware)**

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
