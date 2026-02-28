FROM golang:1.22-alpine AS build

WORKDIR /src

COPY go.mod ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/worker ./cmd/worker

FROM alpine:3.21

RUN adduser -D -u 10001 appuser
USER appuser

COPY --from=build /out/worker /usr/local/bin/worker

ENTRYPOINT ["/usr/local/bin/worker"]
