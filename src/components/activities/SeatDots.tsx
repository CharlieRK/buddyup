type SeatDotsProps = {
  total: number;
  taken: number;
};

export function SeatDots({ total, taken }: SeatDotsProps) {
  return (
    <div
      aria-label={`${taken} of ${total} spots taken`}
      className="flex items-center gap-2"
      role="img"
    >
      {Array.from({ length: total }, (_, index) => {
        const isTaken = index < taken;
        const isCurrentUser = index === 0 && isTaken;

        return (
          <span
            aria-hidden="true"
            className={[
              "h-3.5 w-3.5 rounded-full border",
              isCurrentUser
                ? "border-sun bg-sun"
                : isTaken
                  ? "border-primary bg-primary"
                  : "border-line border-dashed bg-transparent",
            ].join(" ")}
            key={index}
          />
        );
      })}
    </div>
  );
}
