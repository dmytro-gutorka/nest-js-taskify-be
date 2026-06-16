export const milliseconds = {
    seconds: (seconds: number): number => seconds * 1000,
    minutes: (minutes: number): number => minutes * 60 * 1000,
    hours: (hours: number): number => hours * 60 * 60 * 1000,
    days: (days: number): number => days * 24 * 60 * 60 * 1000,
};

export const dateBeforeNow = {
    seconds: (seconds: number): Date => new Date(Date.now() - milliseconds.seconds(seconds)),

    minutes: (minutes: number): Date => new Date(Date.now() - milliseconds.minutes(minutes)),

    hours: (hours: number): Date => new Date(Date.now() - milliseconds.hours(hours)),

    days: (days: number): Date => new Date(Date.now() - milliseconds.days(days)),
};
