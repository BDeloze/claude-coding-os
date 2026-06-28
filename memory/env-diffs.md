# Environment differences

<!-- Document every place staging and prod differ. Goal: minimize this list.
     If a difference is not justified, it is a bug. -->

## Auth
- Staging: <provider config, redirect URLs>
- Prod: <provider config, redirect URLs>

## Storage
- Staging: <buckets, policies>
- Prod: <buckets, policies>

## Feature flags (intentional differences)
- `<flag.name>` — staging: on. Prod: ramping.

## Other
