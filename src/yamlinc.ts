/*!
 * Yamlinc: v0.1.5
 * Copyright(c) 2016-2018 Javanile.org
 * MIT Licensed
 */

// 本コードは https://github.com/javanile/yamlinc を元に
// 処理結果を string で返す仕様に修正したものです
import cuid from "cuid";
import deepmerge from "deepmerge";
import fs from "fs";
import yamljs from "js-yaml";
import { EOL } from "os";
import { dirname, join } from "path";
import {
  error,
  fileExists,
  info,
  isNotEmptyArray,
  isNotEmptyObject,
  isObjectizedArray,
} from "./helpers";

const includeTag = "$include";
const escapeTag = "\\$include";

export function compile(file: string): string {
  if (!fileExists(file)) {
    error("Problem", `file '${file}' not found.`);
    return "";
  }

  info("Analyze", file);
  const data = resolve(file);
  const disclaimer = [`## Source: ${file}`];
  const code = data ? yamljs.dump(data) : `empty: true${EOL}`;

  return disclaimer.join(EOL) + EOL + code;
}

function resolve(file: string): any {
  const base = dirname(file);
  const code = loadMetacode(file);
  try {
    const data = yamljs.load(code);
    recursiveResolve(data, base, file);
    recursiveSanitize(data);

    return data;
  } catch (exception) {
    if (exception instanceof Error) {
      error("Problem", `Error on file '${file}' ${exception.message}`);
      return undefined;
    }
  }
}

function recursiveResolve(
  data: any,
  base: string,
  currentResolve: string
): any {
  if (typeof data !== "object") return;

  let includes: Record<string, any> = {};
  for (const key in data) {
    if (isKeyMatchIncludeTag(key)) {
      if (typeof data[key] === "string" && data[key]) {
        includes = recursiveInclude(base, data[key], includes, currentResolve);
      } else if (typeof data[key] === "object") {
        for (const index in data[key]) {
          includes = recursiveInclude(
            base,
            data[key][index],
            includes,
            currentResolve
          );
        }
      }
      delete data[key];
      continue;
    }
    recursiveResolve(data[key], base, currentResolve);
  }

  if (isNotEmptyObject(includes)) {
    data = Object.assign(data, deepmerge(data, includes));
  } else if (isNotEmptyArray(includes)) {
    data = Object.assign(data, deepmerge(data, includes));
  }

  return data;
}

function recursiveInclude(
  base: string,
  file: string,
  includes: any,
  currentResolve: string
): any {
  if (fileExists(join(base, file))) {
    info("Include", file);
    const include = resolve(join(base, file));

    if (isNotEmptyObject(include)) {
      includes = Object.assign(includes, deepmerge(includes, include));
    } else if (isNotEmptyArray(include)) {
      includes = Object.assign(includes, deepmerge(includes, include));
    }

    return includes;
  }

  const code = fs.readFileSync(currentResolve || "").toString();
  const line =
    (code.substring(0, code.indexOf(file)).match(/\n/g) || []).length + 1;
  error(
    "Problem",
    `file not found '${file}' on '${currentResolve}' at line ${line}.`
  );

  return includes;
}

function recursiveSanitize(data: any): any {
  if (!isNotEmptyObject(data)) {
    return data;
  }

  for (const key in data) {
    if (isObjectizedArray(data[key])) {
      data[key] = Object.values(data[key]);
      continue;
    }

    if (Array.isArray(data[key])) {
      for (const arrKey in data[key]) {
        data[key][arrKey] = recursiveSanitize(data[key][arrKey]);
      }
    } else {
      data[key] = recursiveSanitize(data[key]);
    }
  }

  return data;
}

function getRegExpIncludeTag(): RegExp {
  return new RegExp(`^[- \\t]*${escapeTag}[- \\t]*:`, "gmi");
}

function isKeyMatchIncludeTag(key: string): boolean {
  return !!key.match(new RegExp(`^${escapeTag}_[a-z0-9]{25}$`));
}

function loadMetacode(file: string): string {
  return fs
    .readFileSync(file)
    .toString()
    .replace(getRegExpIncludeTag(), (tag) =>
      tag.replace(
        includeTag,
        `${includeTag}_${cuid().replace(/[\W]+/g, "").substring(0, 25)}`
      )
    );
}
