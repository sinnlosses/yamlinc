/*!
 * Yamlinc: v0.1.2
 * Copyright(c) 2016-2018 Javanile.org
 * MIT Licensed
 */

import colors from "colors";
import fs from "fs";

/**
 * Mute print info/error message
 */
export let mute = false;

export const error = (type: string, msg: string) => {
  if (mute) return;
  console.log(" >", colors.red.bold(type), ":", msg);
};

export const info = (type: string, msg: string) => {
  if (mute) return;
  console.log("  ", colors.gray.bold(type), ":", msg);
};

export const done = (type: string, msg: string) => {
  if (mute) return;
  console.log("  ", colors.green.bold(type), ":", msg);
};

export const fileExists = (file: string): boolean => {
  return file.length != 0 && fs.existsSync(file) && fs.statSync(file).isFile();
};

export const isNotEmptyObject = (value: any): boolean => {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length != 0
  );
};

export const isNotEmptyArray = (value: any): boolean => {
  return !!value && Array.isArray(value) && value.length > 0;
};

export const isObjectizedArray = (value: any) => {
  if (isNotEmptyObject(value)) {
    var i = 0;
    for (var key in value) {
      if (key !== "" + i) {
        return false;
      }
      i++;
    }
    return true;
  }
  return false;
};
