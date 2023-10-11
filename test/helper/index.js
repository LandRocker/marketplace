const { time } = require("@openzeppelin/test-helpers");
const { ethers } = require("hardhat");

let Helper = {};
Helper.travelTime = async (timeFormat, timeDuration) => {
  await time.increase(time.duration[timeFormat](timeDuration));
};

Helper.timeInitial = async (timeFormat, timeDuration) => {
  let x = (await time.latest()).add(time.duration[timeFormat](timeDuration));
  return x;
};
Helper.getNow = async () => {
  return await time.latest();
};
Helper.stringToBytes16 = (str) =>{
  const bytes = ethers.utils.toUtf8Bytes(str);
  if (bytes.length > 16) {
    throw new Error('String is too long for bytes16');
  }
  return ethers.utils.hexConcat([ethers.utils.hexlify(bytes), '0x' + '00'.repeat(16 - bytes.length)]);
}


Helper.convertToSeconds = async (unit, value) =>{
  const secondsInMinute = 60;
  const minutesInHour = 60;
  const hoursInDay = 24;
  const daysInWeek = 7;
  const daysInMonth = 30; // average number of days in a month
  const daysInYear = 365; // considering leap years

  let seconds;

  switch (unit) {
    case 'minutes':
      seconds = value * secondsInMinute;
      break;
    case 'hours':
      seconds = value * minutesInHour * secondsInMinute;
      break;
    case 'days':
      seconds = value * hoursInDay * minutesInHour * secondsInMinute;
      break;
    case 'weeks':
      seconds = value * daysInWeek * hoursInDay * minutesInHour * secondsInMinute;
      break;
    case 'months':
      seconds = value * daysInMonth * hoursInDay * minutesInHour * secondsInMinute;
      break;
    case 'years':
      seconds = value * daysInYear * hoursInDay * minutesInHour * secondsInMinute;
      break;
    default:
      throw new Error('Invalid unit provided. Please use "days", "weeks", "months", or "years".');
  }

  return seconds;
}

module.exports = Helper;
